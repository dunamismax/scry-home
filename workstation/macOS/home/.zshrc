# =============================================================================
# ~/.zshrc — Stephen's development shell
# Updated: 2026-03-05
# =============================================================================

# -----------------------------------------------------------------------------
# PATH & Environment
# -----------------------------------------------------------------------------

# Homebrew (Apple Silicon)
eval "$(/opt/homebrew/bin/brew shellenv)"
export PATH="/opt/homebrew/sbin:$PATH"

# Rust
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

# Existing local bin bootstrap
[[ -f "$HOME/.local/bin/env" ]] && source "$HOME/.local/bin/env"

# Go
export GOPATH="$HOME/go"
export PATH="$GOPATH/bin:$PATH"

# Bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# PostgreSQL 17 (keg-only formula)
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

# Homebrew Ruby (keg-only) + gem bins
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"

# Generic user bins
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"

# Editors
export EDITOR="nvim"
export VISUAL="nvim"

# Locale (consistent UTF-8 everywhere)
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"

# GPG in terminal
export GPG_TTY=$(tty)

# Privacy
export HOMEBREW_NO_ANALYTICS=1

# Python / AI
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0
export TOKENIZERS_PARALLELISM=false

# -----------------------------------------------------------------------------
# Shell behavior
# -----------------------------------------------------------------------------

setopt AUTO_CD
setopt AUTO_PUSHD
setopt PUSHD_IGNORE_DUPS
setopt NO_BEEP
setopt INTERACTIVE_COMMENTS
setopt EXTENDED_GLOB

# History
HISTFILE="$HOME/.zsh_history"
HISTSIZE=50000
SAVEHIST=50000
setopt EXTENDED_HISTORY
setopt HIST_EXPIRE_DUPS_FIRST
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_IGNORE_SPACE
setopt HIST_FIND_NO_DUPS
setopt HIST_SAVE_NO_DUPS
setopt SHARE_HISTORY
setopt INC_APPEND_HISTORY

# Completion
autoload -Uz compinit
if [[ -n ~/.zcompdump(#qN.mh+24) ]]; then
  compinit
else
  compinit -C
fi

zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*' menu select
zstyle ':completion:*' group-name ''
zstyle ':completion:*:descriptions' format '%F{yellow}-- %d --%f'
zstyle ':completion:*:warnings' format '%F{red}-- no matches --%f'
zstyle ':completion:*' use-cache on
zstyle ':completion:*' cache-path "$HOME/.zcompcache"

# -----------------------------------------------------------------------------
# Aliases
# -----------------------------------------------------------------------------

# Modern ls via eza
alias ls='eza --icons --group-directories-first'
alias l='eza -l --icons --group-directories-first'
alias ll='eza -la --icons --group-directories-first --git'
alias la='eza -a --icons --group-directories-first'
alias lt='eza -T --icons --level=3'

# Safer alternates (keep classic commands available)
alias ccat='bat --paging=never'
alias ff='fd'
alias ddu='dust'
alias ddf='duf'
alias pps='procs'
alias ssd='sd'
alias btop='btop'
alias lg='lazygit'
alias v='nvim'

# Git
alias g='git'
alias gs='git status -sb'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gpf='git push --force'
alias gd='git diff'
alias gl='git log --oneline --graph -20'
alias gco='git checkout'
alias gsw='git switch'

# Bun + Python (uv-first)
alias b='bun'
alias br='bun run'
alias py='uv run python'
alias pip='uv pip'

# Package manager preference
alias pnpm='corepack pnpm'

# Docker
alias dc='docker compose'
alias dps='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias dclean='docker system prune -af --volumes'

# Network
alias ports='lsof -iTCP -sTCP:LISTEN -n -P'
alias myip='curl -s ifconfig.me'
alias localip='ipconfig getifaddr en0'

# Quick dirs
alias dev='cd ~/github'
alias ws='cd ~/.openclaw/workspace'
alias zshrc='nvim ~/.zshrc'
alias reload='source ~/.zshrc'

# Misc
alias weather='curl -s "wttr.in?format=3"'
alias path='echo $PATH | tr ":" "\n"'
alias diff='difft'

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------

mkcd() { mkdir -p "$1" && cd "$1"; }
serve() { uv run python -m http.server "${1:-8000}"; }

# add + commit + force-push main (for mirrored repos policy)
gcp() {
  git add -A && git commit -m "${1:-update}" && git push --force origin main
}

# fzf file preview
preview() {
  fzf --preview 'bat --color=always --style=numbers {}' --preview-window=right:60%
}

# Kill process on port
killport() { lsof -ti:"$1" | xargs kill -9 2>/dev/null && echo "Killed process on port $1" || echo "No process on port $1"; }

# Quick git clone into ~/github
clone() { cd ~/github && git clone "$1" && cd "$(basename "$1" .git)"; }

# Extract any archive
extract() {
  case "$1" in
    *.tar.bz2) tar xjf "$1" ;;
    *.tar.gz)  tar xzf "$1" ;;
    *.tar.xz)  tar xJf "$1" ;;
    *.bz2)     bunzip2 "$1" ;;
    *.gz)      gunzip "$1" ;;
    *.tar)     tar xf "$1" ;;
    *.tbz2)    tar xjf "$1" ;;
    *.tgz)     tar xzf "$1" ;;
    *.zip)     unzip "$1" ;;
    *.7z)      7z x "$1" ;;
    *.zst)     unzstd "$1" ;;
    *) echo "Unknown archive: $1" ;;
  esac
}

# Benchmark a command (wraps hyperfine)
bench() { hyperfine --warmup 3 "$@"; }

# -----------------------------------------------------------------------------
# Integrations (interactive shells only)
# -----------------------------------------------------------------------------

if [[ $- == *i* ]]; then
  # fzf integration
  if command -v fzf >/dev/null 2>&1 && [[ -t 1 ]]; then
    source <(fzf --zsh)
    export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
    export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
    export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
    export FZF_DEFAULT_OPTS='--height=40% --layout=reverse --border=rounded --info=inline'
  fi

  # zoxide
  if command -v zoxide >/dev/null 2>&1; then
    eval "$(zoxide init zsh)"
  fi

  # mise (runtime manager)
  if command -v mise >/dev/null 2>&1; then
    eval "$(mise activate zsh)"
  fi

  # direnv
  if command -v direnv >/dev/null 2>&1; then
    eval "$(direnv hook zsh)"
  fi

  # starship
  if command -v starship >/dev/null 2>&1; then
    eval "$(starship init zsh)"
  fi

  # zsh plugins (brew)
  [[ -f /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh ]] && \
    source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh

  [[ -f /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh ]] && \
    source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
fi

# Quiet Homebrew by default
export HOMEBREW_NO_AUTO_UPDATE=1

# Tailscale CLI (app-bundled)
export PATH="/Applications/Tailscale.app/Contents/MacOS:$PATH"
