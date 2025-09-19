"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  CreditCard, 
  Users, 
  Settings, 
  Eye, 
  Bug,
  FileText,
  Activity,
  Shield,
  AlertTriangle
} from "lucide-react";

export function DevPanel() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">856</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Uptime this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0.1%</div>
            <p className="text-xs text-muted-foreground">
              -0.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dev Tools */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stripe">Stripe Data</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="debug">Debug Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5" />
                  System Access
                </CardTitle>
                <CardDescription>
                  Quick access to system administration tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 size-4" />
                  Database Management
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="mr-2 size-4" />
                  Stripe Dashboard
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 size-4" />
                  User Impersonation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 size-4" />
                  System Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest system events and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">INFO</Badge>
                      <span className="text-sm">New user registered</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2m ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">SUCCESS</Badge>
                      <span className="text-sm">Payment processed</span>
                    </div>
                    <span className="text-xs text-muted-foreground">5m ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">WARNING</Badge>
                      <span className="text-sm">High memory usage</span>
                    </div>
                    <span className="text-xs text-muted-foreground">10m ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Stripe Integration
              </CardTitle>
              <CardDescription>
                Monitor payments, subscriptions, and billing data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Failed Payments</h4>
                  <div className="text-2xl font-bold text-red-600">23</div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Pending Invoices</h4>
                  <div className="text-2xl font-bold text-yellow-600">156</div>
                  <p className="text-xs text-muted-foreground">Due soon</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Monthly Revenue</h4>
                  <div className="text-2xl font-bold text-green-600">$12,456</div>
                  <p className="text-xs text-muted-foreground">+15% from last month</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button>
                  <Eye className="mr-2 size-4" />
                  View Stripe Dashboard
                </Button>
                <Button variant="outline">
                  <FileText className="mr-2 size-4" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users, roles, and impersonation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button>
                  <Users className="mr-2 size-4" />
                  View All Users
                </Button>
                <Button variant="outline">
                    <Shield className="mr-2 size-4" />
                  Manage Roles
                </Button>
                <Button variant="outline">
                  <Eye className="mr-2 size-4" />
                  Impersonate User
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                System Logs
              </CardTitle>
              <CardDescription>
                View and analyze system logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded border p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">ERROR</Badge>
                    <span className="text-sm">Database connection timeout</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2024-01-15 14:30:22</span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">INFO</Badge>
                    <span className="text-sm">User login successful</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2024-01-15 14:28:15</span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">WARNING</Badge>
                    <span className="text-sm">High CPU usage detected</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2024-01-15 14:25:10</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                Database Management
              </CardTitle>
              <CardDescription>
                Database operations and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Connection Pool</h4>
                  <div className="text-2xl font-bold">8/20</div>
                  <p className="text-xs text-muted-foreground">Active connections</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Query Time</h4>
                  <div className="text-2xl font-bold">45ms</div>
                  <p className="text-xs text-muted-foreground">Average response</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Database className="mr-2 size-4" />
                  Run Query
                </Button>
                <Button variant="outline">
                  <FileText className="mr-2 size-4" />
                  Export Schema
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="size-5" />
                Debug Tools
              </CardTitle>
              <CardDescription>
                Development and debugging utilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline">
                  <Bug className="mr-2 size-4" />
                  Clear Cache
                </Button>
                <Button variant="outline">
                  <Activity className="mr-2 size-4" />
                  Health Check
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 size-4" />
                  System Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
