"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsCardsProps {
  totalEmployees: number;
  totalAmount: number;
  claimed: number;
  pending: number;
  paymentDay: number | null;
}

export function MetricsCards({
  totalEmployees,
  totalAmount,
  claimed,
  pending,
  paymentDay,
}: MetricsCardsProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Total Employees</CardTitle>
          <CardDescription>Number of employees in payroll</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalEmployees}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Payroll Amount</CardTitle>
          <CardDescription>Total amount to be paid</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claimed</CardTitle>
          <CardDescription>Amount already claimed</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${claimed.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <CardDescription>Amount pending claim</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${pending.toFixed(2)}</p>
        </CardContent>
      </Card>

      {paymentDay && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Payment Day</CardTitle>
            <CardDescription>Day of month when payroll is available</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Day {paymentDay}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

