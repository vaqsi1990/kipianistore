import ProductForm from "../../../components/ProductForm"; 

export default function NewPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-52 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <ProductForm />
        </div>
      </div>
    </div>
  );
}
