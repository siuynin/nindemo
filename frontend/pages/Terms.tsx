import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="px-6 py-8 text-gray-800 dark:text-gray-100 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Điều khoản sử dụng</h1>
      <p className="mb-3">
        Bằng việc sử dụng NDhubs AI, bạn đồng ý tuân thủ các điều khoản sau đây.
        Vui lòng đọc kỹ để hiểu quyền và nghĩa vụ của bạn khi sử dụng dịch vụ.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Tài khoản và bảo mật</h2>
      <ul className="list-disc pl-6 mb-3">
        <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động từ tài khoản.</li>
        <li>Không được chia sẻ tài khoản hoặc sử dụng trái phép tài khoản của người khác.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Sử dụng dịch vụ</h2>
      <ul className="list-disc pl-6 mb-3">
        <li>Không sử dụng dịch vụ cho mục đích trái pháp luật, vi phạm bản quyền, hoặc nội dung bị cấm.</li>
        <li>Không làm gián đoạn hệ thống, tấn công, hoặc lạm dụng tài nguyên.</li>
        <li>Tuân thủ chính sách của các nền tảng bên thứ ba tích hợp (ví dụ: Google, nhà cung cấp AI).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Nội dung do người dùng tạo</h2>
      <p className="mb-3">
        Bạn sở hữu nội dung do bạn tạo, nhưng cấp phép cho chúng tôi quyền sử dụng nội dung đó để vận hành,
        cải thiện dịch vụ và tuân thủ yêu cầu pháp lý. Bạn chịu trách nhiệm đảm bảo nội dung hợp pháp.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Giới hạn trách nhiệm</h2>
      <p className="mb-3">
        Dịch vụ được cung cấp "như hiện có". Trong phạm vi cho phép của pháp luật, chúng tôi không chịu trách nhiệm
        cho các thiệt hại gián tiếp, đặc biệt hoặc phát sinh do việc sử dụng dịch vụ.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Chấm dứt</h2>
      <p className="mb-3">
        Chúng tôi có thể tạm ngừng hoặc chấm dứt quyền truy cập của bạn nếu phát hiện hành vi vi phạm.
        Bạn có thể chấm dứt sử dụng bất cứ lúc nào bằng cách ngừng truy cập dịch vụ.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Sửa đổi điều khoản</h2>
      <p className="mb-3">
        Điều khoản có thể được cập nhật định kỳ. Việc tiếp tục sử dụng dịch vụ sau khi cập nhật đồng nghĩa chấp nhận
        điều khoản mới.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Liên hệ</h2>
      <p className="mb-3">
        Mọi thắc mắc liên quan đến điều khoản, vui lòng liên hệ qua trang <a href="/contact" className="text-blue-600">Liên hệ</a>.
      </p>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">Cập nhật gần đây: %BUILD_DATE%</p>
    </div>
  );
};

export default Terms;

