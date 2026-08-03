# Create a persistent Git worktree, enter it, and start Pi there.
piwt() {
  emulate -L zsh

  if (( $# < 1 || $# > 2 )); then
    print -u2 "usage: piwt <branch> [base]"
    return 2
  fi

  local branch=$1
  local base=${2:-HEAD}
  local root
  root=$(git rev-parse --show-toplevel) || return

  local slug=${branch//\//-}
  local target=${PI_WORKTREE_HOME:-${root:h}}/${root:t}-${slug}

  if [[ -e $target ]]; then
    print -u2 "piwt: target already exists: $target"
    return 1
  fi

  git -C "$root" worktree add -b "$branch" "$target" "$base" || return
  cd "$target" || return
  print "piwt: $target"
  pi
}
