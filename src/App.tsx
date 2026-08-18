import { useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './components/HomePage';
import { CommitteesPage } from './components/CommitteesPage';
import { RegistrationPage } from './components/RegistrationPage';

type Page = 'home' | 'committees' | 'register';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'committees':
        return <CommitteesPage />;
      case 'register':
        return <RegistrationPage onComplete={() => handleNavigate('home')} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default App;
