'use strict';

const path = require('path');

const exts = {
  '.aif': 'AIF audio file',
  '.cda': 'CD audio track file',
  '.mid': 'MIDI audio file',
  '.mp3': 'MP3 audio file',
  '.mpa': 'MPEG2 audio file',
  '.ogg': 'Ogg Vorbis audio file',
  '.wav': 'WAV file',
  '.wma': 'WMA audio file',
  '.wpl': 'Windows Media Player playlist',
  '.7z': '7Zip compressed file',
  '.arj': 'ARJ compressed file',
  '.deb': 'Debian software package file',
  '.pkg': 'Package file',
  '.rar': 'RAR file',
  '.rpm': 'Red Hat Package Manager',
  '.tar.gz': 'Tarball compressed file',
  '.z': 'Z compressed file',
  '.zip': 'Zip compressed file',
  '.bin': 'Binary disc image',
  '.dmg': 'macOS X disk image',
  '.iso': 'ISO disc image',
  '.toast': 'Toast disc image',
  '.vcd': 'Virtual CD',
  '.csv': 'Comma separated value file',
  '.dat': 'Data file',
  '.db': 'Database file',
  '.dbf': 'Database file',
  '.log': 'Log file',
  '.mdb': 'Microsoft Access database file',
  '.sav': 'Save file',
  '.sql': 'SQL database file',
  '.tar': 'Linux / Unix tarball file archive',
  '.xml': 'XML file',
  '.apk': 'Android package file',
  '.bat': 'Batch file',
  '.cgi': 'Perl script file',
  '.pl': 'Perl script file',
  '.com': 'MSDOS command file',
  '.exe': 'Executable file',
  '.gadget': 'Windows gadget',
  '.jar': 'Java Archive file',
  '.py': 'Python file',
  '.wsf': 'Windows Script File',
  '.fnt': 'Windows font file',
  '.fon': 'Generic font file',
  '.otf': 'Open type font file',
  '.ttf': 'TrueType font file',
  '.ai': 'Adobe Illustrator file',
  '.bmp': 'Bitmap image',
  '.gif': 'GIF image',
  '.ico': 'Icon file',
  '.jpeg': 'JPEG image',
  '.jpg': 'JPEG image',
  '.png': 'PNG image',
  '.ps': 'PostScript file',
  '.psd': 'PSD image',
  '.svg': 'Scalable Vector Graphics file',
  '.tif': 'TIFF image',
  '.tiff': 'TIFF image',
  '.asp': 'Active Server Page file',
  '.aspx': 'Active Server Page file',
  '.cer': 'Internet security certificate',
  '.cfm': 'ColdFusion Markup file',
  '.css': 'Cascading Style Sheet file',
  '.htm ': 'HTML file',
  '.html': 'HTML file',
  '.js': 'JavaScript file',
  '.jsp': 'Java Server Page file',
  '.part': 'Partially downloaded file',
  '.php': 'PHP file',
  '.rss': 'RSS file',
  '.xhtml': 'XHTML file',
  '.key': 'Keynote presentation',
  '.odp': 'OpenOffice Impress presentation file',
  '.pps': 'PowerPoint slide show',
  '.ppt': 'PowerPoint presentation',
  '.pptx': 'PowerPoint Open XML presentation',
  '.c': 'C and C++ source code file',
  '.class': 'Java class file',
  '.cpp': 'C++ source code file',
  '.cs': 'Visual C# source code file',
  '.h': 'C, C++, and Objective C header file',
  '.java': 'Java Source code file',
  '.sh': 'Bash shell script',
  '.swift': 'Swift source code file',
  '.vb': 'Visual Basic file',
  '.ods': 'OpenOffice Calc spreadsheet file',
  '.xlr': 'Microsoft Works spreadsheet file',
  '.xls': 'Microsoft Excel file',
  '.xlsx': 'Microsoft Excel Open XML spreadsheet file',
  '.bak': 'Backup file',
  '.cab': 'Windows Cabinet file',
  '.cfg': 'Configuration file',
  '.cpl': 'Windows Control panel file',
  '.cur': 'Windows cursor file',
  '.dll': 'DLL file',
  '.dmp': 'Dump file',
  '.drv': 'Device driver file',
  '.icns': 'macOS X icon resource file',
  '.ini': 'Initialization file',
  '.lnk': 'Windows shortcut file',
  '.msi': 'Windows installer package',
  '.sys': 'Windows system file',
  '.tmp': 'Temporary file',
  '.3g2': '3GPP2 multimedia file',
  '.3gp': '3GPP multimedia file',
  '.avi': 'AVI file',
  '.flv': 'Adobe Flash file',
  '.h264': 'H.264 video file',
  '.m4v': 'Apple MP4 video file',
  '.mkv': 'Matroska Multimedia Container',
  '.mov': 'Apple QuickTime movie file',
  '.mp4': 'MPEG4 video file',
  '.mpg': 'MPEG video file',
  '.mpeg': 'MPEG video file',
  '.rm': 'RealMedia file',
  '.swf': 'Shockwave flash file',
  '.vob': 'DVD Video Object',
  '.wmv': 'Windows Media Video file',
  '.doc': 'Microsoft Word file',
  '.docx': 'Microsoft Word file',
  '.odt': 'OpenOffice Writer document file',
  '.pdf': 'PDF file',
  '.rtf': 'Rich Text Format',
  '.tex': 'A LaTeX document file',
  '.txt': 'Plain text file',
  '.wks': 'Microsoft Works file',
  '.wps': 'Microsoft Works file',
  '.wpd': 'WordPerfect document',
};

exports.getFileFilter = function (filePath) {
  const ext = path.extname(filePath);
  const found = exts[ext];
  if (found) {
    return {name: found, extensions: [ext]};
  }
  return {name: '?', extensions: [ext]};
};

let FileMagic;
let MagicFlags;
function getFileMagic() {
  ({FileMagic, MagicFlags} = require('@npcz/magic'));

  // Tell FileMagic where to find the magic.mgc file
  FileMagic.magicFile = require.resolve('@npcz/magic/dist/magic.mgc');

  // We can only use MAGIC_PRESERVE_ATIME on operating systems that support
  // it and that includes OS X for example. It's a good practice as we don't
  // want to change the last access time because we are just checking the file
  // contents type
  if (process.platform === 'darwin' || process.platform === 'linux') {
    FileMagic.defaultFlags = MagicFlags.MAGIC_PRESERVE_ATIME;
  }
}

exports.getMimeType = async function (filePath) {
  if (!FileMagic) {
    getFileMagic();
  }

  const magic = await FileMagic.getInstance();

  try {
    const result = magic.detect(filePath, magic.flags | MagicFlags.MAGIC_MIME);
    let [mime, charset] = result.split(';');
    mime = mime.trim();
    charset = charset.trim().split('=')[1];
    return {mime, charset};
  } finally {
    FileMagic.close();
  }
};
