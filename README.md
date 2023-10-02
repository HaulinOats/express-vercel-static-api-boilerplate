# Express Vercel Static Site with API Boilerplate

I created this boilerplate for those that want a super simple way of deploying a static Express server on Vercel that can make Serverless API function calls and return JSON responses. I've found this to be a useful template for building super simple websites or applications with free hosting. This also doesn't include any extra things like hot reloading, Typescript conversion, SASS, etc, so keep that in mind. Feel free to fork and add whatever additional configurations you want.

Simply run `npx vercel dev` at the project root which will mimic your production settings on
Vercel for linked project. No need to define `main` or `scripts` nodes in
`package.json`.

The `vercel.json` handles api requests via the `rewrites` node and
`cleanUrls` node just makes it that html file extensions aren't included in route/url.
