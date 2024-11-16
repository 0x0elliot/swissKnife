"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `https://eth.blockscout.com/api/v2/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch search results.");
      }

      const data = await response.json();
      setSearchResults(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (address) => {
    router.push(`/search/${address}`);
  };

  return (
    <div className="container mx-auto px-4">
      <section aria-labelledby="search-section" className="mb-12">
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">
            Search Smart Contracts
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Enter a contract address to view its details and analysis
          </p>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="0x000...0000"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-6 text-lg rounded-full bg-gray-50 border-transparent focus:border-transparent focus:ring-0 hover:bg-gray-100 transition-colors"
              />
              <div className="absolute right-2">
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="rounded-full px-6 py-6 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 transition-colors"
                >
                  {isSearching ? (
                    "Searching..."
                  ) : (
                    <>
                      Search
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
          {error && (
            <div className="mt-4 text-red-500">
              <p>Error: {error}</p>
            </div>
          )}
          <div className="mt-8 text-left">
            {!hasSearched ? (
              <div className="p-8 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <p className="text-gray-500">
                  Search results will appear here after you perform a search
                </p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <>
                <h3 className="text-xl font-semibold mb-4">Search Results</h3>
                <ul className="space-y-4">
                  {searchResults.map((result, index) => (
                    <li 
                      key={index} 
                      className="p-4 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer transition-colors"
                      onClick={() => handleResultClick(result.address)}
                    >
                      <p>
                        <strong>Address:</strong> {result.address}
                      </p>
                      {result.ens_info?.name && (
                        <p>
                          <strong>ENS Name:</strong> {result.ens_info.name}
                        </p>
                      )}
                      {result.name && (
                        <p>
                          <strong>Name:</strong> {result.name}
                        </p>
                      )}
                      {result.type && (
                        <p>
                          <strong>Type:</strong> {result.type}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="p-8 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <p className="text-gray-500">
                  No results found for your search
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}