import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Search, Filter, Check } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const InstitutionListing = () => {
  const { category } = useParams<{category: string}>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [feeRangeFilter, setFeeRangeFilter] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredInstitutions, setFilteredInstitutions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInstitutions, setTotalInstitutions] = useState(0);
  const institutionsPerPage = 12;

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await axios.get<{ success: boolean; data: Category[] }>(
          `${import.meta.env.VITE_API_URL}/categories`
        );
        
        if (response.data.success && Array.isArray(response.data.data)) {
          const foundCategory = response.data.data.find(cat => cat.slug === category);
          if (foundCategory) {
            setCategoryData(foundCategory);
          }
        }
      } catch (err) {
        console.error('Error fetching category:', err);
      }
    };

    if (category) {
      fetchCategory();
    }
  }, [category]);

  const fetchInstitutions = async (page = 1) => {
      try {
        setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: institutionsPerPage.toString(),
        ...(cityFilter && { city: cityFilter }),
        ...(typeFilter && { type: typeFilter })
      });

      const response = await axios.get<{
        success: boolean;
        data: any[];
        pagination: { totalPages: number; total: number };
        message?: string;
      }>(`${import.meta.env.VITE_API_URL}/institutions/list/${category}?${queryParams}`);
        
        if (response.data.success) {
          setInstitutions(response.data.data || []);
        setFilteredInstitutions(response.data.data || []);
        setTotalPages(response.data.pagination.totalPages);
        setTotalInstitutions(response.data.pagination.total);
        setCurrentPage(page);
        } else {
          throw new Error(response.data.message || 'Failed to fetch institutions');
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch institutions');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchInstitutions(1);
  }, [category, cityFilter, typeFilter]);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...institutions];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inst => 
        inst.name.toLowerCase().includes(query) ||
        inst.address.toLowerCase().includes(query) ||
        inst.type.toLowerCase().includes(query)
      );
    }

    // Apply city filter
    if (cityFilter) {
      filtered = filtered.filter(inst => inst.city === cityFilter);
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(inst => inst.type === typeFilter);
    }

    // Apply fee range filter
    if (feeRangeFilter) {
      filtered = filtered.filter(inst => {
        const startingFee = parseFloat(inst.starting_from);
        switch (feeRangeFilter) {
          case 'under-50k':
            return startingFee < 50000;
          case '50k-100k':
            return startingFee >= 50000 && startingFee <= 100000;
          case 'above-100k':
            return startingFee > 100000;
          default:
            return true;
        }
      });
    }

    setFilteredInstitutions(filtered);
  }, [searchQuery, cityFilter, typeFilter, feeRangeFilter, institutions]);

  if (!category || !categoryData) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <p>The category you are looking for doesn't exist.</p>
          <Link to="/categories">
            <Button className="mt-4">Back to Categories</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const categoryTitle = categoryData.name;

  // Extract unique cities and types for filters
  const cities = [...new Set(institutions.map(inst => inst.city))];
  const types = [...new Set(institutions.map(inst => inst.type))];

  // Clear all filters
  const clearFilters = () => {
    setCityFilter(null);
    setTypeFilter(null);
    setSearchQuery("");
    setFeeRangeFilter(null);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setCityFilter(newFilters.city);
    setTypeFilter(newFilters.type);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    fetchInstitutions(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Please wait while we fetch the institutions.</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 py-12">
        <div className="container">
          <h1 className="text-3xl font-bold mb-8">Browse {categoryTitle}</h1>

          {/* Search and filter bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={`Search ${categoryTitle.toLowerCase()}...`}
                className="pl-10 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-education-500 focus:border-education-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="h-4 w-4" />
              Filter Options
            </Button>
          </div>

          {/* Filters section - conditionally rendered */}
          {filterOpen && (
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Filters</h2>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-education-600 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* City filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">City</h3>
                  <div className="space-y-2">
                    {cities.map(city => (
                      <label key={city} className="flex items-center">
                        <input
                          type="radio"
                          name="city"
                          checked={cityFilter === city}
                          onChange={() => setCityFilter(city)}
                          className="mr-2 h-4 w-4 text-education-600 focus:ring-education-500"
                        />
                        {city}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Type filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Type</h3>
                  <div className="space-y-2">
                    {types.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          checked={typeFilter === type}
                          onChange={() => setTypeFilter(type)}
                          className="mr-2 h-4 w-4 text-education-600 focus:ring-education-500"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fee range filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Fee Range</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="feeRange"
                        checked={feeRangeFilter === 'under-50k'}
                        onChange={() => setFeeRangeFilter('under-50k')}
                        className="mr-2 h-4 w-4 text-education-600 focus:ring-education-500"
                      />
                      Under ₹50,000
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="feeRange"
                        checked={feeRangeFilter === '50k-100k'}
                        onChange={() => setFeeRangeFilter('50k-100k')}
                        className="mr-2 h-4 w-4 text-education-600 focus:ring-education-500"
                      />
                      ₹50,000 - ₹1,00,000
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="feeRange"
                        checked={feeRangeFilter === 'above-100k'}
                        onChange={() => setFeeRangeFilter('above-100k')}
                        className="mr-2 h-4 w-4 text-education-600 focus:ring-education-500"
                      />
                      Above ₹1,00,000
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results summary */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredInstitutions.length} {filteredInstitutions.length === 1 ? 'result' : 'results'}
              {searchQuery && ` for "${searchQuery}"`}
              {cityFilter && ` in ${cityFilter}`}
              {typeFilter && ` for ${typeFilter}`}
              {feeRangeFilter && (
                feeRangeFilter === 'under-50k' ? ' under ₹50,000' :
                feeRangeFilter === '50k-100k' ? ' between ₹50,000 - ₹1,00,000' :
                ' above ₹1,00,000'
              )}
            </p>
          </div>

          {/* Institution cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstitutions.map((institution) => (
              <div key={institution.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-w-16 aspect-h-9 relative h-48">
                  <img
                    src={institution.thumbnail_url}
                    alt={institution.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{institution.name}</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <span>{institution.rating}</span>
                      <span className="ml-1 text-yellow-500">★</span>
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{institution.address}</p>
                  <div className="flex items-center text-sm mb-4">
                    <span className="text-gray-500 mr-2">Type:</span>
                    <span className="font-medium">{institution.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Starting from</p>
                      <p className="font-bold text-education-600">₹{institution.starting_from.toLocaleString()}</p>
                    </div>
                    <Link to={`/institution/${category}/${institution.id}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredInstitutions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-2xl font-semibold mb-2">No results found</p>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search term</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InstitutionListing;
