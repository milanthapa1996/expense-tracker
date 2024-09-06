"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Wallet, DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const currencies = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  NPR: "₨"
} as const

type CurrencyCode = keyof typeof currencies

type Transaction = {
  id: number
  type: 'income' | 'expense' | 'loan'
  amount: number
  remarks: string
  date: string
}

type MonthData = {
  name: string
  expense: number
  income: number
  loan: number
}

const generateYearData = (year: number): MonthData[] => {
  return Array.from({ length: 12 }, (_, i) => ({
    name: new Date(year, i).toLocaleString('default', { month: 'short' }),
    expense: Math.floor(Math.random() * 1000),
    income: Math.floor(Math.random() * 1500),
    loan: Math.floor(Math.random() * 500)
  }))
}

export default function Home() {
  const [amount, setAmount] = useState("")
  const [transactionType, setTransactionType] = useState<Transaction['type'] | "">("")
  const [remarks, setRemarks] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, type: "expense", amount: 50, remarks: "Groceries", date: "2023-06-15" },
    { id: 2, type: "income", amount: 2000, remarks: "Salary", date: "2023-06-01" },
    { id: 3, type: "expense", amount: 30, remarks: "Bus fare", date: "2023-06-10" },
    { id: 4, type: "loan", amount: 500, remarks: "Personal loan", date: "2023-06-05" },
  ])
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0)
  const [currentMonthExpense, setCurrentMonthExpense] = useState(0)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [yearData, setYearData] = useState<MonthData[]>(generateYearData(selectedYear))
  const { toast } = useToast()

  useEffect(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyIncome = transactions
      .filter(t => t.type === "income" && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpense = transactions
      .filter(t => t.type === "expense" && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0)

    setCurrentMonthIncome(monthlyIncome)
    setCurrentMonthExpense(monthlyExpense)
  }, [transactions])

  useEffect(() => {
    setYearData(generateYearData(selectedYear))
  }, [selectedYear])

  const addTransaction = () => {
    if (!amount || !transactionType || !remarks) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const newTransaction: Transaction = {
      id: transactions.length + 1,
      type: transactionType as Transaction['type'],
      amount: parseFloat(amount),
      remarks,
      date: new Date().toISOString().split('T')[0],
    }

    setTransactions([newTransaction, ...transactions])
    setAmount("")
    setTransactionType("")
    setRemarks("")

    toast({
      title: "Success",
      description: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} added successfully`,
    })
  }

  const totalSavings = transactions.reduce((acc, transaction) => {
    if (transaction.type === "income") return acc + transaction.amount
    if (transaction.type === "expense") return acc - transaction.amount
    return acc
  }, 0)

  const totalLoan = transactions
    .filter((transaction) => transaction.type === "loan")
    .reduce((acc, transaction) => acc + transaction.amount, 0)

  const currentMonth = new Date().toLocaleString('default', { month: 'short' })

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden relative">
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold text-center">Expense Tracker</h1>
          
          <div className="grid grid-cols-2 gap-2">
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium">Total Savings</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-lg font-bold">{currencies[currency]}{totalSavings.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium">Total Loans</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-lg font-bold">{currencies[currency]}{totalLoan.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium">{currentMonth} Income</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-sm font-bold">{currencies[currency]}{currentMonthIncome.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium">{currentMonth} Expense</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-sm font-bold">{currencies[currency]}{currentMonthExpense.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-2">
              <CardTitle className="text-sm">Expense Overview</CardTitle>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[80px] h-8 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2021, 2022, 2023, 2024].map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencies[currency]}${value}`} />
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #ccc', fontSize: '12px' }}
                      formatter={(value, name) => [`${currencies[currency]}${value}`, name]}
                    />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="loan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-2">
                <Label htmlFor="transaction-type" className="text-xs">Type</Label>
                <Select value={transactionType} onValueChange={(value: Transaction['type'] | "") => setTransactionType(value)}>
                  <SelectTrigger id="transaction-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-xs">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="remarks" className="text-xs">Remarks</Label>
                <Input
                  id="remarks"
                  placeholder="Enter remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full text-sm" onClick={addTransaction}>Add Transaction</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center text-xs">
                    <div className={`mr-2 ${
                      transaction.type === "income" ? "text-green-500" : 
                      transaction.type === "expense" ? "text-red-500" : "text-blue-500"
                    }`}>
                      {transaction.type === "income" ? <ArrowUpCircle className="h-3 w-3" /> : 
                       transaction.type === "expense" ? <ArrowDownCircle className="h-3 w-3" /> :
                       <Wallet className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{transaction.remarks}</p>
                      <p className="text-gray-500">{transaction.date}</p>
                    </div>
                    <p className={`font-medium ${
                      transaction.type === "income" ? "text-green-500" : 
                      transaction.type === "expense" ? "text-red-500" : "text-blue-500"
                    }`}>
                      {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                      {currencies[currency]}{transaction.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                <DollarSign className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(currencies) as CurrencyCode[]).map((curr) => (
                <DropdownMenuItem key={curr} onClick={() => setCurrency(curr)}>
                  {curr} ({currencies[curr]})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}