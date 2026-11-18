$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class CredMan3 {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public uint Flags;
    public uint Type;
    public IntPtr TargetName;
    public IntPtr Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize;
    public IntPtr CredentialBlob;
    public uint Persist;
    public uint AttributeCount;
    public IntPtr Attributes;
    public IntPtr TargetAlias;
    public IntPtr UserName;
  }
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool CredRead(string target, uint type, uint flags, out IntPtr cred);
  [DllImport("advapi32.dll")]
  public static extern void CredFree(IntPtr cred);
}
'@

$ptr = [IntPtr]::Zero
if (-not [CredMan3]::CredRead('git:https://github.com', 1, 0, [ref]$ptr)) { throw 'GitHub credential not found' }
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredMan3+CREDENTIAL])
$blob = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $blob, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::UTF8.GetString($blob)
if ($token -match '[\u0000-\u001F]') { $token = [Text.Encoding]::Unicode.GetString($blob) }
[CredMan3]::CredFree($ptr)

$headers = @{
  Authorization = "Bearer $token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent' = 'chanban-deploy'
}

$me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -TimeoutSec 30
$login = $me.login
$repo = Invoke-RestMethod -Uri "https://api.github.com/repos/$login/chanban" -Headers $headers -TimeoutSec 30
$branch = $repo.default_branch
"repo=$($repo.full_name) branch=$branch"

Set-Location 'C:\Users\34350\Desktop\chanban'
$files = git ls-files
$uploaded = 0
foreach ($file in $files) {
  if (-not (Test-Path $file)) { continue }
  $bytes = [IO.File]::ReadAllBytes((Resolve-Path $file))
  $content = [Convert]::ToBase64String($bytes)
  $uri = "https://api.github.com/repos/$login/chanban/contents/$file"
  $sha = $null
  try {
    $old = Invoke-RestMethod -Uri "$uri`?ref=$branch" -Headers $headers -TimeoutSec 30
    $sha = $old.sha
  } catch {}
  $bodyObj = @{
    message = "Update $file"
    content = $content
    branch = $branch
  }
  if ($sha) { $bodyObj.sha = $sha }
  $body = $bodyObj | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Put -Uri $uri -Headers $headers -Body $body -TimeoutSec 60 | Out-Null
  $uploaded++
}
"uploaded=$uploaded"

try {
  Invoke-RestMethod -Method Put -Uri "https://api.github.com/repos/$login/chanban/pages" -Headers $headers -Body '{"build_type":"workflow"}' -TimeoutSec 30 | Out-Null
  'pages=enabled'
} catch {
  "pages=$($_.Exception.Response.StatusCode.value__)"
}

"url=https://$login.github.io/chanban/"
