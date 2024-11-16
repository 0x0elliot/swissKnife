"use client"
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    // Here you would typically make an API call to look up the smart contract
    setTimeout(() => setIsSearching(false), 1000); // Simulate API call
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
        </div>
      </section>
    </div>
  );
}