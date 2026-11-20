import { Link } from '../components/Link';
import { Stack } from '../components/Stack';
import { Text } from '../components/Text';
import { legal } from '../fixtures/navigation';

/* Story-only legal block for the Footer `legal` slot. */
export function LegalContent() {
  return (
    <Stack direction="row" gap="md" align="center" wrap>
      <Text as="span" size="sm" tone="muted">
        {legal.copyright}
      </Text>
      <Stack as="ul" direction="row" gap="md" wrap style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {legal.links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </Stack>
    </Stack>
  );
}
