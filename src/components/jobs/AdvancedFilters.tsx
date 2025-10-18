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
import { SearchFilters } from '@/hooks/useAdvancedSearch';
import { SlidersHorizontal, DollarSign, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { CategoryFilter } from './CategoryFilter';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([
    filters.minBudget || 0,
    filters.maxBudget || 10000
  ]);
  const [radius, setRadius] = useState<number>(filters.radius || 25);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    onFiltersChange({
      ...filters,
      minBudget: values[0] > 0 ? values[0] : undefined,
      maxBudget: values[1] < 10000 ? values[1] : undefined,
    });
  };

  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setRadius(newRadius);
    handleFilterChange('radius', newRadius);
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setRadius(25);
    onFiltersChange({
      sortBy: 'recent',
      datePosted: 'all'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minBudget || filters.maxBudget) count++;
    if (filters.location) count++;
    if (filters.radius && filters.radius !== 25) count++;
    if (filters.datePosted && filters.datePosted !== 'all') count++;
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
                  Advanced Filters
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
            {/* Category Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Category
              </Label>
              <CategoryFilter 
                selectedCategory={filters.category}
                onCategoryChange={(categoryId) => handleFilterChange('category', categoryId)}
              />
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget Range
                </Label>
                <span className="text-sm text-muted-foreground">
                  ${priceRange[0]} - ${priceRange[1] === 10000 ? '10000+' : priceRange[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={10000}
                step={50}
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                className="w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    handlePriceRangeChange([val, priceRange[1]]);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10000;
                    handlePriceRangeChange([priceRange[0], val]);
                  }}
                />
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
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 mi</span>
                    <span>100 mi</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Posted */}
              <div className="space-y-2">
                <Label htmlFor="datePosted" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Posted
                </Label>
                <Select
                  value={filters.datePosted || 'all'}
                  onValueChange={(value) => handleFilterChange('datePosted', value)}
                >
                  <SelectTrigger id="datePosted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Past week</SelectItem>
                    <SelectItem value="month">Past month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sortBy" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sort By
                </Label>
                <Select
                  value={filters.sortBy || 'recent'}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="budget_high">Budget: High to Low</SelectItem>
                    <SelectItem value="budget_low">Budget: Low to High</SelectItem>
                    {filters.query && (
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
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
