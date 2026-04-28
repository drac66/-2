$ErrorActionPreference = 'Stop'

$pathFile = 'C:\Users\damaster\.openclaw\workspace\target_doc_path.txt'
$docPath = [System.IO.File]::ReadAllText($pathFile, [System.Text.Encoding]::UTF8).Trim()
if (-not (Test-Path -LiteralPath $docPath)) { throw ('Doc not found: ' + $docPath) }

function GetNums([string]$s) {
  if ([string]::IsNullOrWhiteSpace($s)) { return @() }
  $ms = [regex]::Matches($s, '[-+]?\d*\.?\d+')
  $arr = @()
  foreach($m in $ms){
    $v=0.0
    if([double]::TryParse($m.Value,[ref]$v)){ $arr += $v }
  }
  return $arr
}

function ParseTable($t){
  $rows=$t.Rows.Count
  $cols=$t.Columns.Count

  if($rows -ge 2 -and $cols -ge 3){
    $x=@(); $y=@()
    for($c=1;$c -le $cols;$c++){
      $a=(($t.Cell(1,$c).Range.Text) -replace '[\r\a]','').Trim()
      $b=(($t.Cell(2,$c).Range.Text) -replace '[\r\a]','').Trim()
      $na=GetNums $a
      $nb=GetNums $b
      if($na.Count -gt 0 -and $nb.Count -gt 0){
        $x+=$na[0]
        $y+=$nb[0]
      }
    }
    if($x.Count -ge 3 -and $x.Count -eq $y.Count){ return ,@($x,$y) }
  }

  if($rows -ge 3 -and $cols -ge 2){
    $x=@(); $y=@()
    for($r=1;$r -le $rows;$r++){
      $a=(($t.Cell($r,1).Range.Text) -replace '[\r\a]','').Trim()
      $b=(($t.Cell($r,2).Range.Text) -replace '[\r\a]','').Trim()
      $na=GetNums $a
      $nb=GetNums $b
      if($na.Count -gt 0 -and $nb.Count -gt 0){
        $x+=$na[0]
        $y+=$nb[0]
      }
    }
    if($x.Count -ge 3 -and $x.Count -eq $y.Count){ return ,@($x,$y) }
  }

  return $null
}

function AddChart($doc,$table,$x,$y,[int]$idx){
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $wb=$excel.Workbooks.Add()
  $ws=$wb.Worksheets.Item(1)

  $ws.Cells.Item(1,1).Value2='U'
  $ws.Cells.Item(1,2).Value2='I'
  for($i=0;$i -lt $x.Count;$i++){
    $ws.Cells.Item($i+2,1).Value2=[double]$x[$i]
    $ws.Cells.Item($i+2,2).Value2=[double]$y[$i]
  }

  $last=$x.Count+1
  $co=$ws.ChartObjects().Add(40,20,640,360)
  $ch=$co.Chart
  $ch.ChartType=74
  $s=$ch.SeriesCollection().NewSeries()
  $s.XValues=$ws.Range("A2:A$last")
  $s.Values=$ws.Range("B2:B$last")

  $ch.HasTitle=$true
  $ch.ChartTitle.Text=('V-I Curve Table ' + $idx)
  $ch.Axes(1).HasTitle=$true
  $ch.Axes(1).AxisTitle.Text='Voltage U'
  $ch.Axes(2).HasTitle=$true
  $ch.Axes(2).AxisTitle.Text='Current I'

  $png = Join-Path $env:TEMP ('va_curve_' + $idx + '.png')
  if(Test-Path $png){ Remove-Item $png -Force }
  $null=$ch.Export($png)

  $r=$table.Range
  $r.Collapse(0)
  $r.InsertParagraphAfter()
  $r.Collapse(0)
  $null=$doc.InlineShapes.AddPicture($png,$false,$true,$r)
  $r.InsertParagraphAfter()

  $wb.Close($false)
  $excel.Quit()

  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($s)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($ch)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($co)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($ws)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($wb)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
}

$word=New-Object -ComObject Word.Application
$word.Visible=$false
$doc=$word.Documents.Open($docPath)
$inserted=0

for($i=1;$i -le $doc.Tables.Count;$i++){
  $t=$doc.Tables.Item($i)
  $xy=ParseTable $t
  if($null -ne $xy){
    AddChart $doc $t $xy[0] $xy[1] $i
    $inserted++
  }
}

$doc.Save()
$doc.Close()
$word.Quit()

[void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc)
[void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
Write-Output ('DONE inserted=' + $inserted + ' path=' + $docPath)
