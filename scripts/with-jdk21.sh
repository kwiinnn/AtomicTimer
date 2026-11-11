#!/usr/bin/env bash
# Runs a command with JDK 21 (what Capacitor 8's Android build expects) when it is installed at the
# standard Arch Linux location; otherwise leaves JAVA_HOME alone (CI sets it via setup-java).
set -euo pipefail
JDK21=/usr/lib/jvm/java-21-openjdk
if [[ -d "$JDK21" ]]; then
  export JAVA_HOME="$JDK21"
  export PATH="$JAVA_HOME/bin:$PATH"
fi
exec "$@"
