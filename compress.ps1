Add-Type -AssemblyName System.Drawing
$img1 = [System.Drawing.Image]::FromFile("assets\images\logo-icon-transparent.png")
$bmp1 = New-Object System.Drawing.Bitmap 128, 128
$g1 = [System.Drawing.Graphics]::FromImage($bmp1)
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g1.DrawImage($img1, 0, 0, 128, 128)
$img1.Dispose()
$bmp1.Save("assets\images\logo-icon-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp1.Dispose()
$g1.Dispose()
