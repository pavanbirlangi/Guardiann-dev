import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { School, Book, Users, Calendar } from "lucide-react";
import axios from "axios";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  subcategories: string[];
  display_order: number;
}

interface ApiResponse {
  success: boolean;
  data: Category[];
  message?: string;
  error?: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<ApiResponse>('http://localhost:3000/api/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        } else {
          setError('Failed to fetch categories');
        }
      } catch (err) {
        setError('Error fetching categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Map of category names to their respective icons
  const categoryIcons: { [key: string]: JSX.Element } = {
    'Schools': <School className="h-10 w-10" />,
    'Colleges': <Book className="h-10 w-10" />,
    'Coaching Centers': <Users className="h-10 w-10" />,
    'PG Colleges': <Calendar className="h-10 w-10" />,
  };

  // Map of category names to their respective colors
  const categoryColors: { [key: string]: string } = {
    'Schools': 'bg-blue-100 text-blue-600',
    'Colleges': 'bg-green-100 text-green-600',
    'Coaching Centers': 'bg-purple-100 text-purple-600',
    'PG Colleges': 'bg-amber-100 text-amber-600',
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  return (
    <Layout>
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Explore Educational Categories
            </h1>
            <p className="text-lg text-gray-600">
              Browse through our comprehensive list of educational institutions and find the perfect fit for your learning journey
            </p>
          </div>

          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="md:flex">
                  <div className="md:flex-shrink-0 flex items-center justify-center p-8 md:w-64">
                    <div className={`p-6 rounded-full ${categoryColors[category.name] || 'bg-gray-100'}`}>{categoryIcons[category.name] || <div className="h-10 w-10" />}</div>
                  </div>
                  <div className="p-8 md:flex-1">
                    <h2 className="text-2xl font-bold mb-3">{category.name}</h2>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    
                    <div className="mb-6">
                      <h3 className="text-sm uppercase text-gray-500 font-semibold mb-2">Popular subcategories:</h3>
                      <div className="flex flex-wrap gap-2">
                        {category.subcategories.map((subcat, index) => (
                          <span 
                            key={index} 
                            className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm"
                          >
                            {subcat}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <Link to={`/categories/${category.slug}`}>
                        <Button className="bg-education-600 hover:bg-education-700">
                          Browse {category.name}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Categories;
