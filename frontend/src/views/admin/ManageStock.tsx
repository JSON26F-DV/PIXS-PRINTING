import { useParams } from 'react-router-dom';

export default function ManageStock() {
  const { product_id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Manage Stock for Product: {product_id}</h1>
      <p>This is a placeholder page for managing stock.</p>
    </div>
  );
}
