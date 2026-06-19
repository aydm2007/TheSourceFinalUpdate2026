Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Get screen bounds
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$width = $bounds.Width
$height = $bounds.Height

# Create bitmap
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Capture screen
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

# Save to artifacts directory directly
$path = "C:\Users\ibrahim\.gemini\antigravity\brain\f2be898e-e68f-404d-be72-6fcabacd3ddb\screenshot.jpg"
$bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Screenshot saved to: $path"
