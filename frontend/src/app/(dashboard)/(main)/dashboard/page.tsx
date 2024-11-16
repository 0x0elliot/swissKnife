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
  const { toast } = useToast();

  const [userinfo, setUserinfo] = useState({});
  const [videoHistory, setVideoHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const handleDownload = async (video: any) => {
    console.log(video);

    if (video.videoURL) {
        try {
            const response = await fetch(video.videoURL, 
                {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/octet-stream',
                    },
                }
            );

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `video_${video.id}.mp4`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
            toast({
                title: "Download Started",
                description: "Your video is downloading. Check your downloads folder!",
            })
        } catch (error) {
            console.error('Download failed:', error);
            toast({
                variant: 'destructive',
                title: "Download Failed",
                description: "There was an error downloading your video. Please try again.",
            })
        }
    }
}

  useEffect(() => {
    const fetchData = async () => {
      const accessToken = cookies.get(null).access_token;
      
      try {
        const userResponse = await axios.get(`${siteConfig.baseApiUrl}/api/user/private/getinfo`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        localStorage.setItem('userinfo', JSON.stringify(userResponse.data.user));
        setUserinfo(userResponse.data.user);

        const videoResponse = await axios.get(`${siteConfig.baseApiUrl}/api/video/private/list`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        setVideoHistory(videoResponse.data.videos);
      } catch (error) {
        if (error.response?.status === 401) {
          window.location.href = '/logout';
        }
      }
    };

    fetchData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = videoHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(videoHistory.length / itemsPerPage);

  const truncateDescription = (description, maxLength = 100) => {
    return description.length > maxLength
      ? description.substring(0, maxLength - 3) + '...'
      : description;
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((video) => (
          <Card key={video.ID} className="flex flex-col">
            <CardHeader>
              <CardTitle>{video.topic}</CardTitle>
              <CardDescription>{truncateDescription(video.description)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>Progress: {video.progress}%</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => window.location.href = `/create/${video.id}/edit`}>
                See Video
              </Button>

              {video.progress === 100 && (
                <Button onClick={() => handleDownload(video) } variant="secondary" className="ml-2">
                  Download
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => setCurrentPage(index + 1)}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}