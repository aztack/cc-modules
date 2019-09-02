# A Cocos Creator Module Manager Panel

## Installation

```bash
cd ~/.CocosCreator/packages
git clone https://github.com/aztack/cc-modules.git
cd cc-modules
npm i
```

## Setup

Open `CC Module Manager` by click 'Main Menu/Extension/CC Module Manager'

Setup mandatory confgiurations.

- `End Point` : Your private gitlab host name
- `Private Token`: Your private token. see [Gitlab: Personal access tokens](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
- `API Version`: Currently only support api v4. Do not change
- `Namespace Name`: Namespace name in which your modules located
- `Namespace Id`: Namespace id in which your modules located.
- `Module Directory`: Directory in which your modules will be downloaded


## Screenshot

![Setup](screenshot.png)

## Conventions

1. All your modules MUST be located in ONE namespace
2. All your modules MUST prefixed with `comp-` and `util-` (for component and utilities). If you need to support more prefixes, modify `panel/index.js getProjects()`
3. All your modules MUST contains a `package.json` which is generated with `npm init` and contains a `version` field as current version.
4. All your module repositories MUST be tagged with semantic version if you want use different versions in different projects.