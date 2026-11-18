Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class CredMan {
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
$ok = [CredMan]::CredRead('git:https://github.com', 1, 0, [ref]$ptr)
if (-not $ok) {
  'notfound'
  exit
}
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredMan+CREDENTIAL])
$user = [Runtime.InteropServices.Marshal]::PtrToStringUni($c.UserName)
$blob = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $blob, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::UTF8.GetString($blob)
if ($token -match '[\u0000-\u001F]') { $token = [Text.Encoding]::Unicode.GetString($blob) }
"user=$user"
"len=$($token.Length)"
[CredMan]::CredFree($ptr)
