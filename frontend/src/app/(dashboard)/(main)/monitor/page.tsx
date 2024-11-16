"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Bell, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Alert,
  AlertDescription 
} from "@/components/ui/alert";

export default function ContractNotifications() {
  const [contracts, setContracts] = useState([
    // Example data - replace with actual data from your backend
    {
      id: 1,
      address: "0x1234...5678",
      telegram: "@user1",
      createdAt: "2024-03-15",
      status: "Active",
    },
  ]);
  
  const [newContract, setNewContract] = useState({
    address: "",
    telegram: "",
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddContract = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validation
    if (!newContract.address || !newContract.telegram) {
      setError("Please fill in all fields");
      return;
    }

    // Here you would typically make an API call to save the contract
    try {
      // Simulating API call
      const newEntry = {
        id: contracts.length + 1,
        address: newContract.address,
        telegram: newContract.telegram,
        createdAt: new Date().toISOString().split('T')[0],
        status: "Active",
      };

      setContracts([...contracts, newEntry]);
      setSuccess("Contract added successfully!");
      setNewContract({ address: "", telegram: "" });
      setIsDialogOpen(false);
    } catch (err) {
      setError("Failed to add contract. Please try again.");
    }
  };

  const handleDelete = (id) => {
    setContracts(contracts.filter(contract => contract.id !== id));
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    // You could add a toast notification here
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Contract Notifications
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Contract
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contract Notification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddContract} className="space-y-4 mt-4">
              <div>
                <Input
                  placeholder="Contract Address (0x...)"
                  value={newContract.address}
                  onChange={(e) =>
                    setNewContract({ ...newContract, address: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  placeholder="Telegram Username (@username)"
                  value={newContract.telegram}
                  onChange={(e) =>
                    setNewContract({ ...newContract, telegram: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full">
                Add Contract
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Address</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No contracts added yet. Add your first contract to get started!
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      {contract.address}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAddress(contract.address)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{contract.telegram}</TableCell>
                  <TableCell>{contract.createdAt}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <Bell className="h-4 w-4 text-green-500" />
                      {contract.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contract.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}