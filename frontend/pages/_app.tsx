import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ThemeProvider } from '../components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const tenantSlug = router.query.tenant as string | undefined;

  return (
    <ThemeProvider tenantSlug={tenantSlug}>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

