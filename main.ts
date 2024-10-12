import * as cli from "@std/cli";
import { basename, extname } from "@std/path/";

const PROGRAM_NAME = "mkdesktop";
const VERSION = "0.1";
const help = `${PROGRAM_NAME} v${VERSION}
  --name NAME              Override the Name attribute
  --comment COMMENT        Add a Comment
  --terminal               Show the terminal
  --categories CATEGORIES  Whitespace delimited list of Categories
  PATH                     Path to the Executable
`;

interface Args {
  path: string;
  name: string;
  comment: string | null;
  terminal: boolean;
  categories: string[];
}

async function extractArgs(args: cli.Args): Promise<Args> {
  if (args._.length != 1 || typeof args._[0] != "string") {
    throw "Please supply a input .desktop file path";
  }

  let path = args._[0];
  try {
    path = await Deno.realPath(path);
  } catch {
    throw `${path} does not exist`;
  }

  let name = basename(path, extname(path));
  if (typeof (args.name) == "string" || typeof (args.name) == "number") {
    name = String(args.name);
  } else if (args.name != null) {
    throw "--name requires an argument";
  }

  let comment = null;
  if (typeof (args.comment) == "string" || typeof (args.comment) == "number") {
    comment = String(args.comment);
  } else if (args.comment != null) {
    throw "--comment requires an argument";
  }

  let terminal = false;
  if (typeof (args.terminal) == "boolean") {
    terminal = args.terminal;
  } else if (args.terminal != null) {
    throw "--terminal does not take any arguments";
  }

  let categories: string[] = [];
  if (typeof (args.categories) == "string") {
    categories = args.categories.split(/\s/);
  } else if (args.categories != null) {
    throw "--categories requires a string argument";
  }

  return { path, name, comment, terminal, categories };
}

function constructDesktop(args: Args): string {
  let desktopfile = "[Desktop Entry]\n";
  desktopfile += "Version=1.0\n";
  desktopfile += "Type=Application\n";
  desktopfile += `Name=${args.name}\n`;
  desktopfile += `Exec=${args.path}\n`;

  if (args.comment != null) {
    desktopfile += `Comment=${args.comment}\n`;
  }
  if (args.terminal) {
    desktopfile += "Terminal=true\n";
  }
  if (args.categories.length > 0) {
    desktopfile += "Categories=";
    for (let i = 0; i < args.categories.length; i++) {
      desktopfile += args.categories[i] + ";";
    }
    desktopfile += "\n";
  }

  desktopfile += "X-Desktop-File-Install-Version=0.26\n";
  return desktopfile;
}

if (import.meta.main) {
  const raw_args = cli.parseArgs(Deno.args);
  if (raw_args.h != null || raw_args.help != null) {
    console.log(help);
    Deno.exit(0);
  }

  let args;
  try {
    args = await extractArgs(raw_args);
  } catch (err) {
    console.log(err);
    Deno.exit(1);
  }
  const desktop = constructDesktop(args);
  console.log(desktop);
}
