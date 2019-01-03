#!/bin/bash

echo "On master branch. Proceeding with publish"
echo "git status"
git status
echo "lerna publish"
npm config set "//registry.npmjs.org/:_authToken=$NPM_TOKEN" -q
echo "npm whoami"
npm whoami
echo "git status"
git status
git config credential.helper store
git config --global user.email "michael.l.north@gmail.com"
git config --global user.name "Mike North"
git config --global push.default simple
echo "https://mike-north:${GH_TOKEN}@github.com/mike-north/code-to-json.git" > ~/.git-credentials
git fetch --tags
echo "TRAVIS_COMMIT=$TRAVIS_COMMIT"
echo "GIT LOG"
git log --oneline
echo "git checkout master"
git checkout "$TRAVIS_BRANCH"
echo "GIT LOG"
git log --oneline
echo "LATEST GIT TAG"
git describe --tags --abbrev=0
echo "git config --list"
git config --list #debug
yarn build
./node_modules/.bin/lerna publish
