function parseBrandLinks(linksStr?: string): Array<{ label: string; url: string }> {
  if (!linksStr) return [];
  return linksStr.split(",").map((item) => {
    const parts = item.split(":");
    if (parts.length < 2) return null;
    const label = parts[0].trim();
    const url = parts.slice(1).join(":").trim();
    return { label, url };
  }).filter((item): item is { label: string; url: string } => item !== null);
}

export function Footer() {
  const title = process.env.NEXT_PUBLIC_BRAND_TITLE;
  const email = process.env.NEXT_PUBLIC_BRAND_EMAIL;
  const wechat = process.env.NEXT_PUBLIC_BRAND_WECHAT;
  const links = parseBrandLinks(process.env.NEXT_PUBLIC_BRAND_LINKS);

  if (!title && !email && !wechat && links.length === 0) {
    return null;
  }

  return (
    <footer className="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-6 pb-8 text-xs text-zinc-500 dark:text-zinc-400">
      <div className="flex flex-col gap-2">
        {title && (
          <div>
            {process.env.NEXT_PUBLIC_BRAND_LINKS?.includes(title) ? (
              <a
                href={parseBrandLinks(process.env.NEXT_PUBLIC_BRAND_LINKS).find((l) => l.label === title)?.url}
                className="hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                {title}
              </a>
            ) : (
              <span>{title}</span>
            )}
          </div>
        )}
        {email && (
          <div>
            Email:{" "}
            <a
              href={`mailto:${email}`}
              className="hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2"
            >
              {email}
            </a>
          </div>
        )}
        {wechat && (
          <div>
            WeChat: <span className="font-mono">{wechat}</span>
          </div>
        )}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}

