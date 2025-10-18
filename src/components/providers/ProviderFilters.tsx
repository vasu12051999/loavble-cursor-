import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SlidersHorizontal, DollarSign, MapPin, Star, Shield, Clock } from 'lucide-react';

export interface ProviderFilters {
  query?: string;
  category?: string;
  location?: string;
  radius?: number;
  minRating?: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  availableOnly?: boolean;
  verifiedOnly?: boolean;
  responseTime?: 'any' | '1' | '3' | '6' | '12' | '24';
  sortBy?: 'rating' | 'price_low' | 'price_high' | 'reviews' | 'recent';
}

interface ProviderFiltersProps {
  filters: ProviderFilters;
  onFiltersChange: (filters: ProviderFilters) => void;
}

export function ProviderFilters({ filters, onFiltersChange }: ProviderFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([
    filters.minHourlyRate || 0,
    filters.maxHourlyRate || 200
  ]);
  const [radius, setRadius] = useState<number>(filters.radius || 25);
  const [minRating, setMinRating] = useState<number>(filters.minRating || 0);

  const handleFilterChange = (key: keyof ProviderFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    onFiltersChange({
      ...filters,
      minHourlyRate: values[0] > 0 ? values[0] : undefined,
      maxHourlyRate: values[1] < 200 ? values[1] : undefined,
    });
  };

  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setRadius(newRadius);
    handleFilterChange('radius', newRadius);
  };

  const handleRatingChange = (value: number[]) => {
    const newRating = value[0];
    setMinRating(newRating);
    handleFilterChange('minRating', newRating > 0 ? newRating : undefined);
  };

  const clearFilters = () => {
    setPriceRange([0, 200]);
    setRadius(25);
    setMinRating(0);
    onFiltersChange({
      sortBy: 'rating'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minHourlyRate || filters.maxHourlyRate) count++;
    if (filters.location) count++;
    if (filters.radius && filters.radius !== 25) count++;
    if (filters.minRating) count++;
    if (filters.availableOnly) count++;
    if (filters.verifiedOnly) count++;
    if (filters.responseTime && filters.responseTime !== 'any') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Filter Providers
                </CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm">
                {isOpen ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Quick Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="available"
                    checked={filters.availableOnly}
                    onCheckedChange={(checked) => handleFilterChange('availableOnly', checked)}
                  />
                  <Label htmlFor="available" className="text-sm cursor-pointer">
                    Available Now
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="verified"
                    checked={filters.verifiedOnly}
                    onCheckedChange={(checked) => handleFilterChange('verifiedOnly', checked)}
                  />
                  <Label htmlFor="verified" className="text-sm cursor-pointer flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Verified Only
                  </Label>
                </div>
              </div>
            </div>

            {/* Hourly Rate Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Hourly Rate
                </Label>
                <span className="text-sm text-muted-foreground">
                  ${priceRange[0]}/hr - ${priceRange[1] === 200 ? '200+' : priceRange[1]}/hr
                </span>
              </div>
              <Slider
                min={0}
                max={200}
                step={5}
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                className="w-full"
              />
            </div>

            {/* Minimum Rating */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Minimum Rating
                </Label>
                <span className="text-sm text-muted-foreground">
                  {minRating > 0 ? `${minRating}+ stars` : 'Any rating'}
                </span>
              </div>
              <Slider
                min={0}
                max={5}
                step={0.5}
                value={[minRating]}
                onValueChange={handleRatingChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Any</span>
                <span>5 stars</span>
              </div>
            </div>

            {/* Location & Radius */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2" htmlFor="location">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="Enter city or zip code"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
              
              {filters.location && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Search Radius</Label>
                    <span className="text-sm text-muted-foreground">{radius} miles</span>
                  </div>
                  <Slider
                    min={5}
                    max={100}
                    step={5}
                    value={[radius]}
                    onValueChange={handleRadiusChange}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Response Time */}
            <div className="space-y-2">
              <Label htmlFor="responseTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Max Response Time
              </Label>
              <Select
                value={filters.responseTime || 'any'}
                onValueChange={(value) => handleFilterChange('responseTime', value)}
              >
                <SelectTrigger id="responseTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">Within 1 hour</SelectItem>
                  <SelectItem value="3">Within 3 hours</SelectItem>
                  <SelectItem value="6">Within 6 hours</SelectItem>
                  <SelectItem value="12">Within 12 hours</SelectItem>
                  <SelectItem value="24">Within 24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <Select
                value={filters.sortBy || 'rating'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger id="sortBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="recent">Recently Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {activeFiltersCount > 0 && (
                  <span>{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied</span>
                )}
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
