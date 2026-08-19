import type { ReactNode } from 'react';

const TOKEN = /(\{[a-zA-Z0-9]+\})/g;

/** Renders a `{token}` template, wrapping substituted values in `<b>` for the 600-weight-amount convention. */
export function renderTemplate(template: string, vars: Record<string, string>): ReactNode {
  return template.split(TOKEN).map((part, i) => {
    const match = /^\{([a-zA-Z0-9]+)\}$/.exec(part);
    if (match && vars[match[1]] !== undefined) {
      return <b key={i}>{vars[match[1]]}</b>;
    }
    return part;
  });
}
