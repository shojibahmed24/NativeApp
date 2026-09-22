Add-Type -AssemblyName System.Drawing
$img2 = [System.Drawing.Image]::FromFile("assets\images\logo-full-transparent.png")
$bmp2 = New-Object System.Drawing.Bitmap 512, 128
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($img2, 0, 0, 512, 128)
$img2.Dispose()
$bmp2.Save("assets\images\logo-full-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp2.Dispose()
$g2.Dispose()
