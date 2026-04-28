$ErrorActionPreference = 'Stop'

function Get-NumbersFromText([string]$text) {
    if ([string]::IsNullOrWhiteSpace($text)) { return @() }
    $matches = [regex]::Matches($text, '[-+]?\d*\.?\d+')
    $nums = @()
    foreach ($m in $matches) {
        $v = 0.0
        if ([double]::TryParse($m.Value, [ref]$v)) { $nums += $v }
    }
    return $nums
}

function Build-XYFromTable($table) {
    $rows = $table.Rows.Count
    $cols = $table.Columns.Count

    if ($rows -ge 2 -and $cols -ge 3) {
        $x = @(); $y = @()
        for ($c = 1; $c -le $cols; $c++) {
            $tx = ($table.Cell(1,$c).Range.Text -replace '[\r\a]','').Trim()
            $ty = ($table.Cell(2,$c).Range.Text -replace '[\r\a]','').Trim()
            $nx = Get-NumbersFromText $tx
            $ny = Get-NumbersFromText $ty
            if ($nx.Count -gt 0 -and $ny.Count -gt 0) {
                $x += $nx[0]
                $y += $ny[0]
            }
        }
        if ($x.Count -ge 3 -and $x.Count -eq $y.Count) { return ,@($x,$y) }
    }

    if ($rows -ge 3 -and $cols -ge 2) {
        $x = @(); $y = @()
        for ($r = 1; $r -le $rows; $r++) {
            $t1 = ($table.Cell($r,1).Range.Text -replace '[\r\a]','').Trim()
            $t2 = ($table.Cell($r,2).Range.Text -replace '[\r\a]','').Trim()
            $n1 = Get-NumbersFromText $t1
            $n2 = Get-NumbersFromText $t2
            if ($n1.Count -gt 0 -and $n2.Count -gt 0) {
                $x += $n1[0]
                $y += $n2[0]
            }
        }
        if ($x.Count -ge 3 -and $x.Count -eq $y.Count) { return ,@($x,$y) }
    }

    return $null
}

function Add-CurveImageBelowTable($wordDoc, $table, $xVals, $yVals, [int]$idx) {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $wb = $excel.Workbooks.Add()
    $ws = $wb.Worksheets.Item(1)

    $ws.Cells.Item(1,1).Value2 = 'U'
    $ws.Cells.Item(1,2).Value2 = 'I'

    for ($i=0; $i -lt $xVals.Count; $i++) {
        $ws.Cells.Item($i+2,1).Value2 = [double]$xVals[$i]
        $ws.Cells.Item($i+2,2).Value2 = [double]$yVals[$i]
    }

    $lastRow = $xVals.Count + 1
    $chartObj = $ws.ChartObjects().Add(60, 20, 640, 360)
    $chart = $chartObj.Chart
    $chart.ChartType = 74

    $series = $chart.SeriesCollection().NewSeries()
    $series.XValues = $ws.Range("A2:A$lastRow")
    $series.Values = $ws.Range("B2:B$lastRow")
    $series.Name = "Curve$idx"

    $chart.HasTitle = $true
    $chart.ChartTitle.Text = "V-I Curve Table $idx"
    $chart.Axes(1).HasTitle = $true
    $chart.Axes(1).AxisTitle.Text = 'Voltage U'
    $chart.Axes(2).HasTitle = $true
    $chart.Axes(2).AxisTitle.Text = 'Current I'

    $tmp = Join-Path $env:TEMP ("va_curve_$idx.png")
    if (Test-Path $tmp) { Remove-Item $tmp -Force }
    $null = $chart.Export($tmp)

    $rng = $table.Range
    $rng.Collapse(0)
    $rng.InsertParagraphAfter()
    $rng.Collapse(0)
    $null = $wordDoc.InlineShapes.AddPicture($tmp, $false, $true, $rng)
    $rng.InsertParagraphAfter()

    $wb.Close($false)
    $excel.Quit()

    [void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($series)
    [void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($chart)
    [void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($chartObj)
    [void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($ws)
    [void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb)
    [void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel)
}

$dir = 'E:\电路基础实验'
$docCandidates = Get-ChildItem -Path $dir -Filter '*.docx' | Sort-Object LastWriteTime -Descending
if (-not $docCandidates -or $docCandidates.Count -eq 0) { throw 'No docx found.' }
$docFile = $docCandidates | Select-Object -First 1

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($docFile.FullName)

$inserted = 0
for ($i = 1; $i -le $doc.Tables.Count; $i++) {
    $t = $doc.Tables.Item($i)
    $xy = Build-XYFromTable $t
    if ($null -ne $xy) {
        Add-CurveImageBelowTable -wordDoc $doc -table $t -xVals $xy[0] -yVals $xy[1] -idx $i
        $inserted++
    }
}

$doc.Save()
$doc.Close()
$word.Quit()

[void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc)
[void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($word)

Write-Output ("DONE file={0} inserted={1}" -f $docFile.FullName, $inserted)
