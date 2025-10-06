import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  PenIcon, 
  ImageIcon, 
  SparklesIcon, 
  SpeakerIcon, 
  DocumentIcon,
  VideoIcon,
  ChevronLeftIcon,
  ChevronRightIcon 
} from './icons';

interface AdminSidebarProps {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  onSetIsHovered: (hovered: boolean) => void;
  onMobileClose?: () => void;
  currentPage: string;
}

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isExpanded,
  isMobileOpen,
  isHovered,
  onSetIsHovered,
  onMobileClose,
  currentPage
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated, totalCredits } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "marketing" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle mobile link click
  const handleMobileLinkClick = useCallback(() => {
    if (isMobile && isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [isMobile, isMobileOpen, onMobileClose]);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation items based on current frontend structure
  const navItems: NavItem[] = [ 
    {
      icon: <ImageIcon className="w-5 h-5" />,
      name: t.sidebar?.imageCreator?.title || 'Image Creator',
      path: '/image-creator',
    },
    {
      icon: <SparklesIcon className="w-5 h-5" />,
      name: t.sidebar?.imageCanvas?.title || 'Image Canvas',
      path: '/image-canvas',
    },
    {
      icon: <ImageIcon className="w-5 h-5" />,
      name: 'Image Tools',
      path: '/image-tools',
    },
    {
      icon: <VideoIcon className="w-5 h-5" />,
      name: t.sidebar?.videoGeneration?.title || 'Video Generation',
      path: '/app/video-generation',
    },
    {
      icon: <SpeakerIcon className="w-5 h-5" />,
      name: t.sidebar?.textToSpeech?.title || 'Text to Speech',
      path: '/text-to-speech',
    },
    
  ];

  const marketingItems: NavItem[] = [
    {
      icon: <DocumentIcon className="w-5 h-5" />,
      name: t.sidebar?.document?.title || 'Document',
      path: '/document',
    },
    {
      icon: <PenIcon className="w-5 h-5" />,
      name: t.sidebar?.creativeEditor?.title || 'Creative Editor',
      path: '/creative-editor',
    },
    
  ];

  const othersItems: NavItem[] = [
    {
      icon: <div className="w-5 h-5 flex items-center justify-center text-lg">💰</div>,
      name: t.sidebar?.pricing?.title || 'Pricing',
      path: '/price',
    },
  ];

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "marketing", "others"].forEach((menuType) => {
      let items: NavItem[] = [];
      if (menuType === "main") items = navItems;
      else if (menuType === "marketing") items = marketingItems;
      else if (menuType === "others") items = othersItems;
      
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "marketing" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "marketing" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "marketing" | "others") => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all duration-200 group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? theme === 'dark'
                    ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span className="flex-shrink-0">
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="font-medium text-sm">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <svg
                  className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180"
                      : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
              to={nav.path}
              onClick={handleMobileLinkClick}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all duration-200 group ${
                isActive(nav.path)
                  ? theme === 'dark'
                    ? 'bg-blue-900/50 text-blue-300 border-l-4 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
                <span className="flex-shrink-0">
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="font-medium text-sm">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      onClick={handleMobileLinkClick}
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive(subItem.path)
                          ? theme === 'dark'
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-blue-100 text-blue-700'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{subItem.name}</span>
                        <div className="flex items-center gap-1">
                          {subItem.new && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                              pro
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed flex flex-col top-0 left-0 h-screen transition-all duration-300 ease-in-out z-50 border-r pt-16 lg:pt-0 ${
        theme === 'dark'
          ? 'bg-gray-900 border-gray-800 text-gray-100'
          : 'bg-white border-gray-200 text-gray-900'
      } ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : "translate-x-0"}`}
      onMouseEnter={() => !isExpanded && onSetIsHovered(true)}
      onMouseLeave={() => onSetIsHovered(false)}
    >
      {/* Logo Section */}
      <div className={`py-8 px-5 flex ${
        !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
      }`}>
        <Link to="/" className="flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold">NinDemo</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear px-5 pb-5">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {/* Main Menu */}
            <div>
              <h2 className={`mb-4 text-xs uppercase font-semibold flex leading-[20px] ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              } ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }`}>
                {isExpanded || isHovered || isMobileOpen ? (
                  t.sidebar?.menu || "MENU"
                ) : (
                  <div className="w-6 h-1 bg-current rounded-full" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* Marketing Menu */}
            <div>
              <h2 className={`mb-4 text-xs uppercase font-semibold flex leading-[20px] ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              } ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }`}>
                {isExpanded || isHovered || isMobileOpen ? (
                  t.sidebar?.marketing || "MARKETING"
                ) : (
                  <div className="w-6 h-1 bg-current rounded-full" />
                )}
              </h2>
              {renderMenuItems(marketingItems, "marketing")}
            </div>

            {/* Others Menu */}
            <div>
              <h2 className={`mb-4 text-xs uppercase font-semibold flex leading-[20px] ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              } ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }`}>
                {isExpanded || isHovered || isMobileOpen ? (
                  t.sidebar?.others || "OTHERS"
                ) : (
                  <div className="w-6 h-1 bg-current rounded-full" />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>

        {/* Credits Widget */}
        {(isExpanded || isHovered || isMobileOpen) && isAuthenticated && (
          <div className={`mt-auto p-4 rounded-lg ${
            theme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="text-center">
              <div className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t.sidebar?.credits || 'Credits'}
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {totalCredits || 0}
              </div>
              <Link
                to="/price"
                onClick={handleMobileLinkClick}
                className="inline-block mt-2 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
              >
                {t.sidebar?.buy_more || 'Buy More'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;