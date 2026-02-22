#!/bin/bash
# Script de pós-instalação para Express PWA
# Atualiza o cache de ícones e o banco de dados de aplicativos do desktop

# Atualiza o cache de ícones (se disponível)
if command -v gtk-update-icon-cache &> /dev/null; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || true
fi

# Atualiza o banco de dados de aplicativos do desktop
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database /usr/share/applications 2>/dev/null || true
fi

# Força a atualização do cache do GNOME Shell (se estiver rodando)
if command -v dbus-send &> /dev/null; then
    dbus-send --type=signal --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:'Main.overview.viewSelector._appDisplay.invalidate()' 2>/dev/null || true
fi

exit 0
