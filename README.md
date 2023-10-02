# Coding With Sandy

### Technologies Used

- [Vercel](https://vercel.com/) for hosting
- [ExpressJS](https://expressjs.com/) for NodeJS static file server: https://vercel.com/guides/using-express-with-vercel
- [JSON Editor](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md) for editing site content at `/admin.html` route
- [Square](https://squareup.com/us/en) for receiving payments: https://squareup.com/us/en/payments

## Project Notes

Site was built using the [Medixi Boostrap template](https://themeforest.net/item/medixi-health-medical-html-template/43617636) from Themeforest. Source zip files located in `/backups` folder. Static files exist in `/public`.

[JSON Editor](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md) library used for editing site content at `/admin` route (`public/admin.html`). This allows Sandy to modify site content without need for developer. [ExtendsClass.com](https://extendsclass.com/) provides an endpoint for hosting the JSON structure used for populating `course schedule` widget located on `schedule` and `signup` pages, and the `package` data in `payment` section of `signup` page. The json endpoint exists at: https://extendsclass.com/jsonstorage/070e0707707e and requires a security key to update: `srivera` sent via `Security-key` header (api documentation towards bottom of page). Admin functionality is directly embedded in `public/admin.html` and have it set to only allow Sandy to update node values (key changes are deactivated and setting `form` mode in options prevents ability to add or modify nodes). I opted for this approach for the sake of simplification and bypassing the need to implement a database. Backup of default JSON state is in `backups/content.json`.

Environment variables will auto-populate in development when using `npx vercel dev`. `.env.sample` shows project environmental variables which are defined in Vercel project settings.

Api routes exist in `/api` and make use of [Vercel Serverless functions with Express](https://vercel.com/guides/using-express-with-vercel).

Simple pushing project to repository triggers auto-build on linked Vercel project.

### TODO List to cover with Sandy:

- Fill in content
- Show how textbook links
- Switch Gmail over to Sandy's business Gmail account
- Switch Square over to Sandy's account from developer account
- Setup Github and Vercel accounts to transfer site
- Go over how to update content with pin and create account on extendsclass site (`https://extendsclass.com/jsonstorage/070e0707707e`)
