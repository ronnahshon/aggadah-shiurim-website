import React, { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Send, Mail, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateSocialSharingUrls } from '@/utils/seoUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface SocialShareButtonsProps {
  url?: string;
  title: string;
  description: string;
  className?: string;
  showLabel?: boolean;
  variant?: 'dropdown' | 'inline' | 'compact';
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url,
  title,
  description,
  className = '',
  showLabel = true,
  variant = 'dropdown'
}) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareUrls = generateSocialSharingUrls(currentUrl, title, description);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: shareUrls.facebook,
      color: 'hover:text-blue-600',
      description: 'Share on Facebook'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: shareUrls.twitter,
      color: 'hover:text-blue-400',
      description: 'Share on Twitter/X'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: shareUrls.linkedin,
      color: 'hover:text-blue-700',
      description: 'Share on LinkedIn'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: shareUrls.whatsapp,
      color: 'hover:text-green-600',
      description: 'Share on WhatsApp'
    },
    {
      name: 'Telegram',
      icon: Send,
      url: shareUrls.telegram,
      color: 'hover:text-blue-500',
      description: 'Share on Telegram'
    },
    {
      name: 'Email',
      icon: Mail,
      url: shareUrls.email,
      color: 'hover:text-gray-600',
      description: 'Share via Email'
    }
  ];

  const handleShare = (platform: typeof socialPlatforms[0]) => {
    if (platform.name === 'Email') {
      // Email links don't need a new window
      window.location.href = platform.url;
    } else {
      // Open other social platforms in new window
      window.open(platform.url, '_blank', 'width=600,height=400');
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {showLabel && (
          <span className="text-sm text-muted-foreground mr-2 self-center">Share:</span>
        )}
        {socialPlatforms.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <Button
              key={platform.name}
              variant="outline"
              size="sm"
              onClick={() => handleShare(platform)}
              className={`${platform.color} transition-colors`}
              title={platform.description}
            >
              <IconComponent className="h-4 w-4" />
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="hover:text-gray-600 transition-colors"
          title="Copy link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {socialPlatforms.slice(0, 3).map((platform) => {
          const IconComponent = platform.icon;
          return (
            <Button
              key={platform.name}
              variant="ghost"
              size="sm"
              onClick={() => handleShare(platform)}
              className={`p-1 h-8 w-8 ${platform.color}`}
              title={platform.description}
            >
              <IconComponent className="h-3 w-3" />
            </Button>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8" title="More sharing options">
              <Share2 className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {socialPlatforms.slice(3).map((platform) => {
              const IconComponent = platform.icon;
              return (
                <DropdownMenuItem key={platform.name} onClick={() => handleShare(platform)}>
                  <IconComponent className="h-4 w-4 mr-2" />
                  {platform.description}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy link'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Default: dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          {showLabel && 'Share'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {socialPlatforms.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <DropdownMenuItem key={platform.name} onClick={() => handleShare(platform)}>
              <IconComponent className="h-4 w-4 mr-2" />
              {platform.description}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShareButtons; 