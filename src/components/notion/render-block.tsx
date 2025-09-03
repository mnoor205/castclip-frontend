"use client";

import React from "react";
import Image from "next/image";

// helper to render rich_text (bold, italic, links, etc.)
function renderText(richText: any[]) {
  return richText.map((t: any, i: number) => {
    let content = t.plain_text;

    if (t.annotations?.bold) {
      content = <strong key={i}>{content}</strong>;
    }
    if (t.annotations?.italic) {
      content = <em key={i}>{content}</em>;
    }
    if (t.annotations?.underline) {
      content = <u key={i}>{content}</u>;
    }
    if (t.annotations?.code) {
      content = (
        <code
          key={i}
          className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono"
        >
          {content}
        </code>
      );
    }
    if (t.href) {
      content = (
        <a
          key={i}
          href={t.href}
          className="text-blue-600 hover:underline"
          target="_blank"
        >
          {content}
        </a>
      );
    }

    return <React.Fragment key={i}>{content}</React.Fragment>;
  });
}

export default function RenderBlocks({ blocks }: { blocks: any[] }) {
  // Group consecutive list items
  const groupedBlocks: any[] = [];
  let currentList: any[] = [];
  let listType: string | null = null;

  blocks.forEach((block: any) => {
    const { type } = block;
    
    if (type === "bulleted_list_item" || type === "numbered_list_item") {
      if (listType === type) {
        currentList.push(block);
      } else {
        // Start new list
        if (currentList.length > 0) {
          groupedBlocks.push({ type: listType, items: currentList });
        }
        currentList = [block];
        listType = type;
      }
    } else {
      // End current list
      if (currentList.length > 0) {
        groupedBlocks.push({ type: listType, items: currentList });
        currentList = [];
        listType = null;
      }
      groupedBlocks.push(block);
    }
  });

  // Add final list if exists
  if (currentList.length > 0) {
    groupedBlocks.push({ type: listType, items: currentList });
  }

  return (
    <div className="space-y-6">
      {groupedBlocks.map((block: any, index: number) => {
        if (block.type === "bulleted_list_item") {
          return (
            <ul key={`bulleted-${index}`} className="list-disc ml-6 space-y-2">
              {block.items.map((item: any) => (
                <li key={item.id}>{renderText(item.bulleted_list_item.rich_text)}</li>
              ))}
            </ul>
          );
        }
        
        if (block.type === "numbered_list_item") {
          return (
            <ol key={`numbered-${index}`} className="list-decimal ml-6 space-y-2">
              {block.items.map((item: any) => (
                <li key={item.id}>{renderText(item.numbered_list_item.rich_text)}</li>
              ))}
            </ol>
          );
        }

        // Handle individual blocks
        const { id, type } = block;
        const value = block[type];

        switch (type) {
          case "heading_1":
            return (
              <h1 key={id} className="text-3xl font-bold">
                {renderText(value.rich_text)}
              </h1>
            );
          case "heading_2":
            return (
              <h2 key={id} className="text-2xl font-semibold">
                {renderText(value.rich_text)}
              </h2>
            );
          case "heading_3":
            return (
              <h3 key={id} className="text-xl font-medium">
                {renderText(value.rich_text)}
              </h3>
            );
          case "paragraph":
            return (
              <p key={id} className="text-gray-700 leading-relaxed">
                {renderText(value.rich_text)}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={id}
                className="border-l-4 border-gray-300 pl-4 italic text-gray-600"
              >
                {renderText(value.rich_text)}
              </blockquote>
            );
          case "divider":
            return <hr key={id} className="my-6 border-gray-300" />;
          case "image": {
            const url =
              value.type === "file" ? value.file.url : value.external.url;
            const caption = value.caption?.[0]?.plain_text || "";
            return (
              <figure key={id} className="my-4">
                <Image
                  src={url}
                  alt={caption}
                  width={800}
                  height={600}
                  className="rounded-xl shadow-md w-full h-auto"
                  unoptimized={url.includes('notion')}
                />
                {caption && (
                  <figcaption className="text-sm text-gray-500 mt-2">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }
          case "code":
            return (
              <pre
                key={id}
                className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto"
              >
                <code>{value.rich_text[0]?.plain_text}</code>
              </pre>
            );
          case "to_do":
            return (
              <div key={id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.checked}
                  readOnly
                  className="w-4 h-4"
                />
                <span>{renderText(value.rich_text)}</span>
              </div>
            );
          case "toggle":
            return (
              <details key={id} className="p-2 border rounded-lg">
                <summary className="cursor-pointer font-medium">
                  {renderText(value.rich_text)}
                </summary>
              </details>
            );
          default:
            return (
              <p key={id} className="text-gray-400">
                ❌ Unsupported block type: <code>{type}</code>
              </p>
            );
        }
      })}
    </div>
  );
}
