let
  nixpkgs = fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-25.05";
  pkgs = import nixpkgs { config = {}; overlays = []; };
in

pkgs.mkShellNoCC {
  packages = with pkgs; [
    nodejs_22
  ];

  shellHook = ''

  echo "=====> NODE VERSION: $(node --version)";
  echo ".....> NODE WHICH: $(which node)";
  ls -la $(which node)

  echo "=====> NPM VERSION (init): $(npm --version)";
  echo ".....> NPM WHICH: $(which npm)";
  ls -la $(which npm)

  echo "-----> NPM CONFIG PREFIX (init): $(npm config get prefix)";

  echo "-----> NPM CONFIG CACHE (init): $(npm config get cache)"

  npm set prefix ~/.npm-global

  export PATH=$HOME/.npm-global/bin:$PATH

  npm update -g npm

  echo "=====> NPM VERSION (updated): $(npm --version)";
  echo ".....> NPM WHICH: $(which npm)";
  ls -la $(which npm)

  if [ -d "$HOME/.npm-global/share/man" ]; then
    _default_manpath=$(manpath 2>/dev/null || echo '/usr/share/man:/usr/local/man')
    export MANPATH="$HOME/.npm-global/share/man:${MANPATH:-$_default_manpath}"
  fi


  '';

}
