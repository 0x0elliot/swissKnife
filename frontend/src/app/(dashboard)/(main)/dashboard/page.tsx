"use client"
import { siteConfig } from "@/app/siteConfig";
import React, { useEffect, useState } from "react";
import cookies from 'nookies';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4">
      <section aria-labelledby="flows-title" className="mb-6">
        <h1 id="overall-title" className="scroll-mt-10 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
          Smart contracts
        </h1>
      </section>
      <section aria-labelledby="flows-description" className="mb-8">
        <p id="overall-description" className="text-lg text-gray-500 dark:text-gray-400">
          All your analysis shows up here
        </p>
      </section>
    </div>
  );
}