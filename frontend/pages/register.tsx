import { ThemeProvider } from '../components/ThemeProvider';
import { Register } from '../screens/Register';

export default function RegisterPage() {
  return (
    <ThemeProvider>
      <Register />
    </ThemeProvider>
  );
}

