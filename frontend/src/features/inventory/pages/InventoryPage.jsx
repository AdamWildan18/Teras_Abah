import { useLocation } from 'react-router-dom';
import RawMaterialPage from './RawMaterialPage';
import ProductPage from './ProductPage';
import RecipePage from './RecipePage';

export default function InventoryPage() {
  const location = useLocation();
  const path = location.pathname;

  // Tentukan tipe berdasarkan URL path
  let type = 'raw'; // default
  
  if (path.includes('/products')) {
    type = 'product';
  } else if (path.includes('/recipes')) {
    type = 'recipe';
  }

  // Render komponen yang sesuai
  switch (type) {
    case 'product':
      return <ProductPage />;
    case 'recipe':
      return <RecipePage />;
    case 'raw':
    default:
      return <RawMaterialPage />;
  }
}