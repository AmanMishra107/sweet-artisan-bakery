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
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    in_stock: true
  });

  const categories = ['Pastries', 'Breads', 'Cakes', 'Desserts', 'Muffins', 'Pies', 'Cookies', 'Cupcakes'];

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    
    // Set up real-time subscription for products in admin dashboard
    const productSubscription = supabase
      .channel('products_admin')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        (payload) => {
          console.log('Product change received in admin:', payload.eventType, payload);
          fetchProducts(); // Refetch products when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productSubscription);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Admin: Fetching products...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Admin: Error fetching products:', error);
        throw error;
      }
      
      console.log('Admin: Fetched products:', data?.length || 0);
      setProducts(data || []);
    } catch (error) {
      console.error('Admin: Failed to fetch products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      console.error('Failed to fetch orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    }
  };

  const handleAddProduct = async () => {
    // Validation
    if (!newProduct.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return;
    }

    if (!newProduct.description.trim()) {
      toast({
        title: "Validation Error", 
        description: "Product description is required",
        variant: "destructive"
      });
      return;
    }

    if (!newProduct.price || isNaN(parseFloat(newProduct.price))) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }

    if (!newProduct.category) {
      toast({
        title: "Validation Error",
        description: "Please select a category",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Admin: Adding product:', newProduct);
      
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: parseFloat(newProduct.price), // Use parseFloat instead of parseInt
        category: newProduct.category,
        image_url: newProduct.image_url.trim() || null,
        in_stock: newProduct.in_stock
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select('*'); // Return the inserted data

      if (error) {
        console.error('Admin: Error adding product:', error);
        
        // Check for specific RLS errors
        if (error.code === '42501' || error.message.includes('permission denied')) {
          toast({
            title: "Permission Error",
            description: "You don't have permission to add products. Check your admin status.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Database Error",
            description: `Failed to add product: ${error.message}`,
            variant: "destructive"
          });
        }
        return;
      }

      console.log('Admin: Product added successfully:', data);

      toast({
        title: "Success",
        description: `Product "${productData.name}" added successfully!`
      });

      // Reset form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        in_stock: true
      });
      
      setIsAddProductOpen(false);
      
      // Fetch products to update the list
      await fetchProducts();
      
      // Force a real-time notification by manually triggering the channel
      console.log('Admin: Triggering manual product refresh...');
      
    } catch (error) {
      console.error('Admin: Exception adding product:', error);
      toast({
        title: "Error",
        description: `Failed to add product: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    // Validation
    if (!editingProduct.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return;
    }

    if (!editingProduct.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Product description is required",
        variant: "destructive"
      });
      return;
    }

    if (!editingProduct.price || editingProduct.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Admin: Updating product:', editingProduct);

      const updateData = {
        name: editingProduct.name.trim(),
        description: editingProduct.description.trim(),
        price: editingProduct.price,
        category: editingProduct.category,
        image_url: editingProduct.image_url?.trim() || null,
        in_stock: editingProduct.in_stock,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', editingProduct.id)
        .select('*');

      if (error) {
        console.error('Admin: Error updating product:', error);
        throw error;
      }

      console.log('Admin: Product updated successfully:', data);

      toast({
        title: "Success",
        description: "Product updated successfully"
      });

      setEditingProduct(null);
      await fetchProducts();
      
    } catch (error) {
      console.error('Admin: Failed to update product:', error);
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Admin: Deleting product:', id);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Admin: Error deleting product:', error);
        throw error;
      }

      console.log('Admin: Product deleted successfully');

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      await fetchProducts();
      
    } catch (error) {
      console.error('Admin: Failed to delete product:', error);
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated"
      });

      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
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
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-sm text-gray-500 mt-2">
                Products: {products.length} | Loading: {loading ? 'Yes' : 'No'}
              </p>
            )}
          </div>
          <Button onClick={onBack} variant="outline">
            Back to Store
          </Button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md z-50">
            Loading...
          </div>
        )}

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
                  <p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
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
                      <p className="font-bold">₹{order.total_amount.toFixed(2)}</p>
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
                  <Button disabled={loading}>
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
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Product name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Product description"
                        required
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
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
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="in_stock"
                        checked={newProduct.in_stock}
                        onChange={(e) => setNewProduct({...newProduct, in_stock: e.target.checked})}
                      />
                      <Label htmlFor="in_stock">In Stock</Label>
                    </div>
                    <Button 
                      onClick={handleAddProduct} 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Adding Product...' : 'Add Product'}
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
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold">₹{product.price}</span>
                        <Badge variant={product.in_stock ? "default" : "destructive"}>
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {product.category}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">ID: {product.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProduct(product)}
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No products found matching your search.' : 'No products available. Add your first product!'}
                </p>
              </div>
            )}

            {/* Edit Product Dialog */}
            <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                {editingProduct && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Name *</Label>
                      <Input
                        id="edit-name"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                        required
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-price">Price (₹) *</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-category">Category *</Label>
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
                    <div>
                      <Label htmlFor="edit-image">Image URL</Label>
                      <Input
                        id="edit-image"
                        value={editingProduct.image_url || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_in_stock"
                        checked={editingProduct.in_stock}
                        onChange={(e) => setEditingProduct({...editingProduct, in_stock: e.target.checked})}
                      />
                      <Label htmlFor="edit_in_stock">In Stock</Label>
                    </div>
                    <Button 
                      onClick={handleEditProduct} 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Updating Product...' : 'Update Product'}
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
                        <p className="font-bold text-lg">₹{order.total_amount.toFixed(2)}</p>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                          disabled={loading}
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
                        {(() => {
                          try {
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                            return items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ));
                          } catch (e) {
                            return <p className="text-sm text-red-500">Error parsing order items</p>;
                          }
                        })()}
                      </div>
                    </div>
                    
                    {order.delivery_address && (
                      <div>
                        <h5 className="font-medium mb-1">Delivery Address:</h5>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            try {
                              const addr = typeof order.delivery_address === 'string' 
                                ? JSON.parse(order.delivery_address) 
                                : order.delivery_address;
                              return `${addr.address}, ${addr.city} - ${addr.postalCode}`;
                            } catch (e) {
                              return 'Error parsing address';
                            }
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

              {orders.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No orders found.</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
