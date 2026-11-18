$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class CredMan2 {
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
if (-not [CredMan2]::CredRead('git:https://github.com', 1, 0, [ref]$ptr)) {
  throw 'GitHub credential not found'
}
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredMan2+CREDENTIAL])
$blob = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $blob, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::UTF8.GetString($blob)
if ($token -match '[\u0000-\u001F]') { $token = [Text.Encoding]::Unicode.GetString($blob) }
[CredMan2]::CredFree($ptr)

$secure = ConvertTo-SecureString $token -AsPlainText -Force
$headers = @{
  Authorization = "Bearer $token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent' = 'chanban-deploy'
}

$me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -TimeoutSec 30
$login = $me.login
"login=$login"

$repoBody = @{
  name = 'chanban'
  description = '馋伴 - 和嘴馋做朋友'
  private = $false
} | ConvertTo-Json

try {
  $repo = Invoke-RestMethod -Method Post -Uri 'https://api.github.com/user/repos' -Headers $headers -Body $repoBody -TimeoutSec 30
  "repo=created"
} catch {
  $repo = Invoke-RestMethod -Uri "https://api.github.com/repos/$login/chanban" -Headers $headers -TimeoutSec 30
  "repo=exists"
}

Set-Location 'C:\Users\34350\Desktop\chanban'
$env:GIT_TERMINAL_PROMPT = '0'
git branch -M main
try { git remote remove origin 2>$null | Out-Null } catch {}
git remote add origin "https://3435025144-del@github.com/$login/chanban.git"
git push -u origin main
"pushed"

try {
  Invoke-RestMethod -Method Put -Uri "https://api.github.com/repos/$login/chanban/pages" -Headers $headers -Body '{"build_type":"workflow"}' -TimeoutSec 30 | Out-Null
  "pages=enabled"
} catch {
  "pages=$($_.Exception.Response.StatusCode.value__)"
}

"url=https://$login.github.io/chanban/"
