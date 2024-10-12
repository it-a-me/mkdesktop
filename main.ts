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
  if (args._.length != 1) {
    throw "Please supply a input .desktop file path";
  }

  let path = String(args._[0]);
  try {
    path = await Deno.realPath(path);
  } catch {
    throw `${path} does not exist`;
  }

  let name = basename(path, extname(path));
  if (args.name != null) {
    name = args.name;
  }

  const comment: string | null = args.comment;
  const terminal = args.terminal;

  let categories: string[] = [];
  if (args.categories != null) {
    categories = args.categories.split(/\s/);
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
  const raw_args = cli.parseArgs(Deno.args, {
    string: ["name", "comment", "categories"],
    boolean: ["help", "terminal"],
    alias: {
      help: "h",
      terminal: "t",
      name: "n",
      comment: "c",
    },
  });
  if (raw_args.help) {
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
