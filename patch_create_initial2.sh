#!/bin/bash
sed -i 's/      isMultiplayer ? multiplayerTargetScore : DEFAULT_TARGET_SCORE,//g' components/give-or-take-game.tsx
