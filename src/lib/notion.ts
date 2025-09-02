import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET,
});

export const databaseId = "26106e2c57ac80cdb193ef2f0698412a";
