"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Bell, Copy, ChevronDown, ChevronRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

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

import cookies from 'nookies';
import { stringify } from "querystring";

// API configuration
const API_URL = "http://localhost:5002/api/telegram/private";

const JSONViewer = ({ data }) => {
    const [expanded, setExpanded] = useState({});

    const toggleExpand = (path) => {
        setExpanded(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const renderValue = (value, path) => {
        if (value === null) return <span className="text-gray-500">null</span>;
        if (typeof value === "boolean") return <span className="text-purple-500">{value.toString()}</span>;
        if (typeof value === "number") return <span className="text-blue-500">{value}</span>;
        if (typeof value === "string") return <span className="text-green-500">"{value}"</span>;
        if (Array.isArray(value)) {
            if (value.length === 0) return "[]";
            return (
                <div className="ml-4">
                    <div 
                        className="cursor-pointer inline-flex items-center"
                        onClick={() => toggleExpand(path)}
                    >
                        {expanded[path] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        [{value.length}]
                    </div>
                    {expanded[path] && (
                        <div className="ml-4">
                            {value.map((item, i) => (
                                <div key={i}>
                                    {renderValue(item, `${path}.${i}`)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        if (typeof value === "object") {
            return (
                <div className="ml-4">
                    <div 
                        className="cursor-pointer inline-flex items-center"
                        onClick={() => toggleExpand(path)}
                    >
                        {expanded[path] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {"{...}"}
                    </div>
                    {expanded[path] && (
                        <div className="ml-4">
                            {Object.entries(value).map(([key, val]) => (
                                <div key={key} className="flex">
                                    <span className="text-gray-700 dark:text-gray-300 mr-2">"{key}":</span>
                                    {renderValue(val, `${path}.${key}`)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return String(value);
    };

    return (
        <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
            {renderValue(data, 'root')}
        </div>
    );
};


export default function ContractNotifications() {
    const [contracts, setContracts] = useState([]);
    const [accessToken, setAccessToken] = useState("");
    const [newContract, setNewContract] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [ruleResult, setRuleResult] = useState(null);

    const handleEvaluateRule = async (rule) => {
        console.log("Evaluating rule", rule);
        try {
            const response = await fetch("/api/proxy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rule: rule,
                    data: {
                        event: {
                            name: "LogEvent",
                            signature: "LogEvent(address,address,string)",
                            inputs: [
                                {
                                    name: "contractAddress",
                                    value: "0xb2bCaf9a4A047BB867153BFA17E07452Cb112DCc",
                                    hashed: false,
                                    type: "address",
                                },
                                {
                                    name: "userAddress",
                                    value: "0xEb87fcc7B227400D157dD976d1C4B18f42dC14fa",
                                    hashed: false,
                                    type: "address",
                                },
                                {
                                    name: "userInput",
                                    value: "lolu",
                                    hashed: false,
                                    type: "string",
                                },
                            ],
                            rawFields: `{"address":"0xb2bcaf9a4a047bb867153bfa17e07452cb112dcc","topics":["0x83ae8ebb74f70a26d57e444142d19edd2d90cbc4b72f6e590c10797227e33695","0x000000000000000000000000b2bcaf9a4a047bb867153bfa17e07452cb112dcc","0x000000000000000000000000eb87fcc7b227400d157dd976d1c4b18f42dc14fa"],"data":"0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000046c6f6c7500000000000000000000000000000000000000000000000000000000","blockNumber":"0x6c2e21","transactionHash":"0x2206cc35ed6275d09ed3f3c8c89a815d8bec592f352462323d63480f139d244e","transactionIndex":"0xa","blockHash":"0x56a5a03b01a3929970d11517ec28967dfd8d83a084c80e26e1f3e11b4e1e30bc","logIndex":"0x12","removed":false}`,
                            contract: {
                                address: "0xb2bCaf9a4A047BB867153BFA17E07452Cb112DCc",
                                addressLabel: "mycontract",
                                name: "mycontract",
                                label: "mycontract",
                            },
                            indexInLog: 18,
                        },
                        transaction: {
                            from: "0xEb87fcc7B227400D157dD976d1C4B18f42dC14fa",
                            txData:
                                "0x2e3c2a4d000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000046c6f6c7500000000000000000000000000000000000000000000000000000000",
                            txHash:
                                "0x2206cc35ed6275d09ed3f3c8c89a815d8bec592f352462323d63480f139d244e",
                            txIndexInBlock: 10,
                            blockHash:
                                "0x56a5a03b01a3929970d11517ec28967dfd8d83a084c80e26e1f3e11b4e1e30bc",
                            blockNumber: 7089697,
                            contract: {
                                address: "0xb2bCaf9a4A047BB867153BFA17E07452Cb112DCc",
                                addressLabel: "mycontract",
                                name: "mycontract",
                                label: "mycontract",
                            },
                            method: {
                                name: "emitLog",
                                signature: "emitLog(string)",
                                inputs: [
                                    {
                                        name: "userInput",
                                        value: "lolu",
                                        type: "string",
                                    },
                                ],
                            },
                        },
                    },
                }),
            });

            const result = await response.json();

            if (response.ok) {
                if (result.result) {
                    setRuleResult("true");
                }
                else {
                    setRuleResult("false");
                }
            } else {
                setRuleResult("false");
            }
        } catch (error) {
            setRuleResult({ error: "Error evaluating rule" });
        }
    };

    const handleRuleChange = (e) => {
        const value = e.target.value;
        setNewContract((prevState) => ({
            ...prevState,
            setRule: value,
        }));
        handleEvaluateRule(value); // Trigger the evaluation request
    };


    const fetchContracts = async (AcessToken) => {
        try {
            const response = await fetch(`${API_URL}/get-scanning`, {
                headers: {
                    "Authorization": `Bearer ${AcessToken}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (data.success) {
                const formattedContracts = data.data.map(contract => ({
                    id: contract.id,
                    address: contract.contract_address,
                    telegram: contract.telegram_username,
                    createdAt: new Date(contract.created_at).toLocaleDateString(),
                    status: "Active"
                }));
                setContracts(formattedContracts);
            } else {
                setError("Failed to fetch contracts");
            }
        } catch (err) {
            setError("Error connecting to the API");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let accessToken = cookies.get(null).access_token;
        setAccessToken(accessToken);
        fetchContracts(accessToken);
    }, []);

    const handleAddContract = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        console.log(newContract);

        if (!newContract.address || !newContract.telegram) {
            setError("Please fill in all fields");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/set-scanning`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contract_address: newContract.address,
                    telegram_username: newContract.telegram,
                    set_rule: newContract.setRule === "true" // Convert string to boolean
                })
            });

            const data = await response.json();

            if (data.success) {
                await fetchContracts(accessToken);
                setSuccess("Contract added successfully!");
                setNewContract({ address: "", telegram: "", setRule: "true" });
                setIsDialogOpen(false);
            } else {
                setError(data.message || "Failed to add contract");
            }
        } catch (err) {
            setError("Failed to add contract. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_URL}/delete-contract/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${API_TOKEN}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (data.success) {
                await fetchContracts(accessToken);
            } else {
                setError("Failed to delete contract");
            }
        } catch (err) {
            setError("Error deleting contract");
        }
    };

    const copyAddress = (address) => {
        navigator.clipboard.writeText(address);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

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

                    <DialogContent className="w-screen">
                    <div style = {{ overflow: "hidden" }} > 
                        <DialogHeader>
                            <DialogTitle>Add New Contract To Monitor</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddContract} className="space-y-4 mt-4">
                            <div  style={{ overflow: "hidden" }} >
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
                            <div>
                                <label className="block text-sm font-medium mb-2">Set Rule</label>
                                <Input
                                    placeholder="Enter rule"
                                    // pre-filled with -> data["event"]["signature"] == "LogEvent(address,address,string)
                                    // value="data['event']['signature'] == 'LogEvent(address,address,string)'"
                                    onChange={handleRuleChange}
                                    className="w-full"

                                />
                            </div>

                            {ruleResult && (
                            <Card>
                                <CardContent className="pt-6">
                                    <h2 className="font-semibold mb-2">Rule Evaluation</h2>
                                    <div className="mb-2">
                                        <span className="font-medium">Result: </span>
                                        <span className={ruleResult === "true" ? "text-green-500" : "text-red-500"}>
                                            {ruleResult}
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="font-medium mb-2">Test Data:</h3>
                                        <JSONViewer data={{
                                            event: {
                                                name: "LogEvent",
                                                signature: "LogEvent(address,address,string)",
                                                inputs: [
                                                    {
                                                        name: "contractAddress",
                                                        value: "0xb2bCaf9a4A047BB867153BFA17E07452Cb112DCc",
                                                        type: "address"
                                                    },
                                                    {
                                                        name: "userAddress",
                                                        value: "0xEb87fcc7B227400D157dD976d1C4B18f42dC14fa",
                                                        type: "address"
                                                    },
                                                    {
                                                        name: "userInput",
                                                        value: "lolu",
                                                        type: "string"
                                                    }
                                                ]
                                            }
                                        }} />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

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
                    </div>
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