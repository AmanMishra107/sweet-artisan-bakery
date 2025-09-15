import React, { useState, useEffect } from 'react';
import { Package, Plus, Users, ShoppingCart, TrendingUp, Edit, Trash2, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  in_stock: boolean;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  items: any;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address?: any;
  special_instructions?: string;
  amount: number;
  currency: string;
  delivery_fee: number;
  delivery_time: string;
  discount_amount: number;
  stripe_session_id: string;
  updated_at: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    in_stock: true
  });

  const categories = ['Pastries', 'Breads', 'Cakes', 'Desserts', 'Muffins', 'Pies'];

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          name: newProduct.name,
          description: newProduct.description,
          price: parseInt(newProduct.price),
          category: newProduct.category,
          image_url: newProduct.image_url || null,
          in_stock: newProduct.in_stock
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully"
      });

      setIsAddProductOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        in_stock: true
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          category: editingProduct.category,
          image_url: editingProduct.image_url,
          in_stock: editingProduct.in_stock
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully"
      });

      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated"
      });

      fetchOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your bakery business</p>
          </div>
          <Button onClick={onBack} variant="outline">
            Back to Store
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === id 
                  ? 'bg-background shadow-sm' 
                  : 'hover:bg-background/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{totalRevenue}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold">{pendingOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-orange-500" />
              </div>
            </Card>

            {/* Recent Orders */}
            <Card className="p-6 md:col-span-3">
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{order.total_amount}</p>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Product description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        placeholder="Price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="image">Image URL (optional)</Label>
                      <Input
                        id="image"
                        value={newProduct.image_url}
                        onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                        placeholder="Image URL"
                      />
                    </div>
                    <Button onClick={handleAddProduct} className="w-full">
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="space-y-3">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold">₹{product.price}</span>
                        <Badge variant={product.in_stock ? "default" : "destructive"}>
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Edit Product Dialog */}
            <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                {editingProduct && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Name</Label>
                      <Input
                        id="edit-name"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-price">Price (₹)</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({...editingProduct, price: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select value={editingProduct.category} onValueChange={(value) => setEditingProduct({...editingProduct, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleEditProduct} className="w-full">
                      Update Product
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">All Orders</h3>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Order #{order.id.slice(0, 8)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{order.total_amount}</p>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Items:</h5>
                      <div className="space-y-1">
                        {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x {item.quantity}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {order.delivery_address && (
                      <div>
                        <h5 className="font-medium mb-1">Delivery Address:</h5>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const addr = typeof order.delivery_address === 'string' 
                              ? JSON.parse(order.delivery_address) 
                              : order.delivery_address;
                            return `${addr.address}, ${addr.city} - ${addr.postalCode}`;
                          })()}
                        </p>
                      </div>
                    )}
                    
                    {order.special_instructions && (
                      <div>
                        <h5 className="font-medium mb-1">Special Instructions:</h5>
                        <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}