export default function Breadcrumb({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol 
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
        className="flex text-sm text-text-light"
      >
        {items.map((item, index) => (
          <li
            key={item.href}
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
            className="flex items-center"
          >
            {index > 0 && <span className="mx-2">/</span>}
            <a 
              itemProp="item" 
              href={item.href}
              className="hover:text-primary transition-colors"
            >
              <span itemProp="name">{item.name}</span>
            </a>
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

