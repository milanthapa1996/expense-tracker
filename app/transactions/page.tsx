'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { db, auth } from '@/app/firebase/config'
import { currencies, CurrencyCode, Transaction, TransactionType } from '@/lib/types'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [filterType, setFilterType] = useState<TransactionType | "all">("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        loadTransactions(user.uid)
      } else {
        router.push('/')
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    filterTransactions()
  }, [transactions, filterType, filterDateFrom, filterDateTo, searchQuery])

  const loadTransactions = (userId: string) => {
    const q = query(
      collection(db, `users/${userId}/transactions`),
      orderBy('date', 'desc')
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[]
      setTransactions(loadedTransactions)
    })

    return unsubscribe
  }

  const filterTransactions = () => {
    let filtered = transactions

    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType)
    }

    if (filterDateFrom) {
      filtered = filtered.filter(t => t.date >= filterDateFrom)
    }

    if (filterDateTo) {
      filtered = filtered.filter(t => t.date <= filterDateTo)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.remarks.toLowerCase().includes(query) || 
        t.amount.toString().includes(query)
      )
    }

    setFilteredTransactions(filtered)
  }

  const handleEdit = async (transaction: Transaction) => {
    if (!user) return

    try {
      const transactionRef = doc(db, `users/${user.uid}/transactions`, transaction.id)
      await updateDoc(transactionRef, {
        type: transaction.type,
        amount: transaction.amount,
        remarks: transaction.remarks,
        date: transaction.date,
      })

      toast({
        title: "Success",
        description: "Transaction updated successfully",
        className: "bg-green-500",
      })
      setEditingTransaction(null)
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, `users/${user.uid}/transactions`, id))
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
        className: "bg-green-500",
      })
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">All Transactions</h1>
      
      <div className="flex flex-wrap gap-4">
        <Select value={filterType} onValueChange={(value: TransactionType | "all") => setFilterType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="loan">Loan</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="From Date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="w-[180px]"
        />

        <Input
          type="date"
          placeholder="To Date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="w-[180px]"
        />

        <Input
          type="text"
          placeholder="Search transactions"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[200px]"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <div className="flex items-center">
                  {transaction.type === "income" ? <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" /> : 
                   transaction.type === "expense" ? <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" /> :
                   <Wallet className="h-4 w-4 text-blue-500 mr-2" />}
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </div>
              </TableCell>
              <TableCell>{transaction.date}</TableCell>
              <TableCell className={`font-medium ${
                transaction.type === "income" ? "text-green-500" : 
                transaction.type === "expense" ? "text-red-500" : "text-blue-500"
              }`}>
                {currencies[currency]}{transaction.amount.toFixed(2)}
              </TableCell>
              <TableCell>{transaction.remarks}</TableCell>
              <TableCell className="text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(transaction)}>
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit transaction</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Transaction</DialogTitle>
                    </DialogHeader>
                    {editingTransaction && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-type">Type</Label>
                          <Select
                            value={editingTransaction.type}
                            onValueChange={(value: TransactionType) => setEditingTransaction({...editingTransaction, type: value})}
                          >
                            <SelectTrigger id="edit-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                              <SelectItem value="loan">Loan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-amount">Amount</Label>
                          <Input
                            id="edit-amount"
                            type="number"
                            value={editingTransaction.amount}
                            onChange={(e) => setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-remarks">Remarks</Label>
                          <Input
                            id="edit-remarks"
                            value={editingTransaction.remarks}
                            onChange={(e) => setEditingTransaction({...editingTransaction, remarks: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-date">Date</Label>
                          <Input
                            id="edit-date"
                            type="date"
                            value={editingTransaction.date}
                            onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                          />
                        </div>
                        <Button onClick={() => handleEdit(editingTransaction)}>Save Changes</Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete transaction</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}