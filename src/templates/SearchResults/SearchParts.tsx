import type { ActionLink } from '../../component-types/sections';
import { Badge } from '../../components/Badge';
import { Card, CardGrid } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Link } from '../../components/Link';
import { LinkList } from '../../components/LinkList';
import { Stack } from '../../components/Stack';
import { Text } from '../../components/Text';
import type { SearchResult } from '../../content-types/templates';
import { searchPageHref } from '../pagination';

export function NoQuery() {
  return <EmptyState title="Enter a search term" message="Search articles, services and help pages. Try a word like “payroll” or “VAT”." />;
}

export function NoResults({ query, suggestions, basePath, contact }: { query: string; suggestions: string[]; basePath: string; contact?: ActionLink }) {
  return (
    <EmptyState title={`Nothing matched “${query}”`} message="Check the spelling, or try a broader or different word.">
      {suggestions.length > 0 && (
        <Stack gap="xs" align="center">
          <Text size="sm" weight="strong">
            Try searching for
          </Text>
          <LinkList
            items={suggestions.map((s) => ({ label: s, href: searchPageHref(basePath, s, 1), ariaLabel: `Search for ${s}` }))}
            direction="row"
            label="Suggested searches"
          />
        </Stack>
      )}
      {contact && (
        <Text size="sm">
          Still stuck? <Link href={contact.href}>{contact.label}</Link>
        </Text>
      )}
    </EmptyState>
  );
}

/** Results as cards: the title is the link; trail, URL and type badge add context. */
export function ResultList({ results }: { results: (SearchResult & { url: string })[] }) {
  return (
    <CardGrid columns={1}>
      {results.map((result) => (
        <Card
          key={result.id}
          title={result.title}
          href={result.url}
          description={result.excerpt}
          eyebrow={result.type && <Badge size="sm">{result.type}</Badge>}
          headingLevel={2}
          footer={
            <Stack gap="xs">
              {result.trail?.length ? (
                <Text size="sm" tone="muted">
                  {result.trail.map((item) => item.label).join(' › ')}
                </Text>
              ) : null}
              <Text size="xs" tone="subtle">
                {result.url}
              </Text>
            </Stack>
          }
        />
      ))}
    </CardGrid>
  );
}
